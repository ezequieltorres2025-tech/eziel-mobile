import { useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { UserProfile } from "@/features/auth/userProfileService";
import type { PublishImage } from "@/features/publish/components/PublishImagePicker";

import {
  SERVICE_PUBLICATION_DURATION_DAYS,
  SERVICE_PUBLICATION_PRICE_ARS,
} from "../serviceConstants";

import {
  SERVICE_PRICE_TYPE_OPTIONS,
  SERVICE_RESPONSE_TIME_OPTIONS,
  parseCommaList,
  type ServiceCategory,
} from "../serviceFormOptions";

import {
  publishService,
} from "../publishServiceService";

import type {
  PublishServiceResult,
  ServicePriceType,
  ServiceResponseTime,
} from "../serviceTypes";

import { ServiceImagePicker } from "./ServiceImagePicker";
import { ServiceLocationContactStep } from "./ServiceLocationContactStep";
import { ServicePricingStep } from "./ServicePricingStep";
import { ServiceProfessionalStep } from "./ServiceProfessionalStep";

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";
const ORANGE_SOFT = "#FFF7ED";
const ORANGE_BORDER = "#FED7AA";

const SURFACE = "#FFFFFF";
const BACKGROUND = "#F8FAFC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const MUTED_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const SUCCESS = "#15803D";
const SUCCESS_SOFT = "#F0FDF4";
const SUCCESS_BORDER = "#BBF7D0";
const DANGER = "#DC2626";
const DANGER_SOFT = "#FEF2F2";
const DANGER_BORDER = "#FECACA";

type ServiceFlowStep = 1 | 2 | 3 | 4;

interface PublishServiceFlowProps {
  isAuthenticated: boolean;
  userProfile?: UserProfile | null;
  disabled?: boolean;

  onRequestSignIn?: () => void;
  onExit?: () => void;
  onStepChange?: (step: ServiceFlowStep) => void;

  onPublished?: (
    result: PublishServiceResult,
  ) => void;
}

const STEP_LABELS: Record<
  ServiceFlowStep,
  string
> = {
  1: "Servicio",
  2: "Precio",
  3: "Cobertura",
  4: "Confirmar",
};

function formatIntegerArs(
  value: number,
): string {
  const integerValue =
    Math.max(0, Math.trunc(value));

  return integerValue
    .toString()
    .replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ".",
    );
}

function formatPriceSummary(
  priceType: ServicePriceType,
  priceValue: string,
): string {
  if (priceType === "quote") {
    return "A consultar";
  }

  const price =
    Number(priceValue);

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return "Sin definir";
  }

  const formatted =
    `$${formatIntegerArs(price)}`;

  switch (priceType) {
    case "from":
      return `Desde ${formatted}`;

    case "hourly":
      return `${formatted} por hora`;

    case "fixed":
    default:
      return formatted;
  }
}

function getProfessionalError(
  title: string,
  specialty: string,
  description: string,
): string | null {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return "Ingresá el título del servicio.";
  }

  if (cleanTitle.length < 5) {
    return "El título debe tener al menos 5 caracteres.";
  }

  const cleanSpecialty =
    specialty.trim();

  if (!cleanSpecialty) {
    return "Ingresá tu especialidad.";
  }

  if (cleanSpecialty.length < 3) {
    return "La especialidad debe tener al menos 3 caracteres.";
  }

  const cleanDescription =
    description.trim();

  if (!cleanDescription) {
    return "Ingresá una descripción del servicio.";
  }

  if (cleanDescription.length < 15) {
    return "La descripción debe tener al menos 15 caracteres.";
  }

  return null;
}

function getPricingError(
  priceType: ServicePriceType,
  price: string,
  experienceYears: string,
): string | null {
  if (priceType !== "quote") {
    const numericPrice =
      Number(price);

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return "Ingresá un precio válido o elegí A consultar.";
    }
  }

  if (experienceYears.trim()) {
    const years =
      Number(experienceYears);

    if (
      !Number.isFinite(years) ||
      years < 0 ||
      years > 80
    ) {
      return "Los años de experiencia deben estar entre 0 y 80.";
    }
  }

  return null;
}

function getLocationContactError(
  city: string,
  whatsapp: string,
  phone: string,
): string | null {
  if (!city.trim()) {
    return "Ingresá la ciudad principal donde trabajás.";
  }

  if (
    !whatsapp.trim() &&
    !phone.trim()
  ) {
    return "Agregá al menos WhatsApp o teléfono.";
  }

  return null;
}

function getPriceTypeLabel(
  value: ServicePriceType,
): string {
  return (
    SERVICE_PRICE_TYPE_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? value
  );
}

function getResponseTimeLabel(
  value: ServiceResponseTime,
): string {
  return (
    SERVICE_RESPONSE_TIME_OPTIONS.find(
      (option) =>
        option.value === value,
    )?.label ?? "Sin especificar"
  );
}

export function PublishServiceFlow({
  isAuthenticated,
  userProfile = null,
  disabled = false,
  onRequestSignIn,
  onExit,
  onStepChange,
  onPublished,
}: PublishServiceFlowProps) {
  const [step, setStep] =
    useState<ServiceFlowStep>(1);

  const [title, setTitle] =
    useState("");

  const [
    category,
    setCategory,
  ] = useState<ServiceCategory>(
    "Profesionales",
  );

  const [
    specialty,
    setSpecialty,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    keywords,
    setKeywords,
  ] = useState("");

  const [
    priceType,
    setPriceType,
  ] =
    useState<ServicePriceType>(
      "from",
    );

  const [price, setPrice] =
    useState("");

  const [
    experienceYears,
    setExperienceYears,
  ] = useState("");

  const [
    responseTime,
    setResponseTime,
  ] =
    useState<ServiceResponseTime>(
      "unknown",
    );

  const [city, setCity] =
    useState("");

  const [province, setProvince] =
    useState("");

  const [zones, setZones] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [images, setImages] =
    useState<PublishImage[]>([]);

  const [
    acceptedPublication,
    setAcceptedPublication,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  const [
    isPublishing,
    setIsPublishing,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    publishedResult,
    setPublishedResult,
  ] =
    useState<PublishServiceResult | null>(
      null,
    );

  const professionalError =
    getProfessionalError(
      title,
      specialty,
      description,
    );

  const pricingError =
    getPricingError(
      priceType,
      price,
      experienceYears,
    );

  const locationContactError =
    getLocationContactError(
      city,
      whatsapp,
      phone,
    );

  const allRequiredDataReady =
    !professionalError &&
    !pricingError &&
    !locationContactError;

  const progressWidth =
    `${step * 25}%` as `${number}%`;

  const uploadPercent =
    Math.round(
      Math.min(
        Math.max(uploadProgress, 0),
        1,
      ) * 100,
    );

  const uploadWidth =
    `${uploadPercent}%` as `${number}%`;

  const publicationPriceLabel =
    `$${formatIntegerArs(
      SERVICE_PUBLICATION_PRICE_ARS,
    )}`;

  const priceSummary =
    formatPriceSummary(
      priceType,
      price,
    );

  const experienceSummary =
    experienceYears.trim()
      ? `${experienceYears.trim()} ${
          Number(experienceYears) === 1
            ? "año"
            : "años"
        }`
      : "No informado";

  const keywordsArray =
    useMemo(
      () =>
        parseCommaList(
          keywords,
        ),
      [keywords],
    );

  const zonesArray =
    useMemo(
      () => parseCommaList(zones),
      [zones],
    );

  const goToStep = (
    nextStep: ServiceFlowStep,
  ) => {
    if (
      isPublishing ||
      disabled
    ) {
      return;
    }

    setValidationError(null);
    setStep(nextStep);
    onStepChange?.(nextStep);
  };

  const handleContinueFromProfessional =
    () => {
      if (professionalError) {
        setValidationError(
          professionalError,
        );

        return;
      }

      goToStep(2);
    };

  const handleContinueFromPricing =
    () => {
      if (pricingError) {
        setValidationError(
          pricingError,
        );

        return;
      }

      goToStep(3);
    };

  const handleContinueFromLocation =
    () => {
      if (locationContactError) {
        setValidationError(
          locationContactError,
        );

        return;
      }

      goToStep(4);
    };

  const validateEverything =
    (): string | null => {
      if (professionalError) {
        return professionalError;
      }

      if (pricingError) {
        return pricingError;
      }

      if (locationContactError) {
        return locationContactError;
      }

      return null;
    };

  const handleRequestAuthentication =
    () => {
      if (onRequestSignIn) {
        onRequestSignIn();
        return;
      }

      Alert.alert(
        "Iniciá sesión",
        "Necesitás iniciar sesión para enviar la solicitud de publicación.",
      );
    };

  const handlePublish =
    async () => {
      if (
        isPublishing ||
        disabled ||
        publishedResult
      ) {
        return;
      }

      if (!isAuthenticated) {
        handleRequestAuthentication();
        return;
      }

      const finalError =
        validateEverything();

      if (finalError) {
        setValidationError(
          finalError,
        );

        return;
      }

      if (!acceptedPublication) {
        setValidationError(
          `Confirmá que entendés que la publicación cuesta ${publicationPriceLabel} por ${SERVICE_PUBLICATION_DURATION_DAYS} días.`,
        );

        return;
      }

      const numericPrice =
        priceType === "quote"
          ? 0
          : Number(price);

      const numericExperience =
        experienceYears.trim()
          ? Number(
              experienceYears,
            )
          : 0;

      try {
        setValidationError(null);
        setIsPublishing(true);
        setUploadProgress(0);

        const result =
          await publishService(
            {
              title,
              description,
              category,
              specialty,

              keywords:
                keywordsArray,

              city,
              province,

              zones:
                zonesArray,

              priceType,
              price:
                numericPrice,

              whatsapp,
              phone,

              experienceYears:
                numericExperience,

              responseTime,

              images,
            },
            {
              userProfile,

              onUploadProgress:
                (progress) => {
                  setUploadProgress(
                    progress.overallProgress,
                  );
                },
            },
          );

        setUploadProgress(1);

        setPublishedResult(
          result,
        );

        onPublished?.(
          result,
        );
      } catch (error) {
        setUploadProgress(0);

        setValidationError(
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud del servicio.",
        );
      } finally {
        setIsPublishing(false);
      }
    };

  const resetFlow = () => {
    if (isPublishing) {
      return;
    }

    setStep(1);

    setTitle("");
    setCategory(
      "Profesionales",
    );
    setSpecialty("");
    setDescription("");
    setKeywords("");

    setPriceType("from");
    setPrice("");
    setExperienceYears("");
    setResponseTime(
      "unknown",
    );

    setCity("");
    setProvince("");
    setZones("");
    setWhatsapp("");
    setPhone("");

    setImages([]);

    setAcceptedPublication(
      false,
    );

    setValidationError(null);
    setUploadProgress(0);
    setPublishedResult(null);

    onStepChange?.(1);
  };

  if (publishedResult) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>
            ✓
          </Text>
        </View>

        <Text style={styles.successEyebrow}>
          SOLICITUD ENVIADA
        </Text>

        <Text style={styles.successTitle}>
          Tu servicio quedó pendiente de pago
        </Text>

        <Text style={styles.successDescription}>
          Eziel creó la solicitud correctamente. El servicio todavía
          no está activo ni visible como publicación aprobada.
        </Text>

        <View style={styles.successSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Servicio
            </Text>

            <Text style={styles.summaryValue}>
              {title.trim()}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Importe
            </Text>

            <Text style={styles.summaryValue}>
              {publicationPriceLabel}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Duración
            </Text>

            <Text style={styles.summaryValue}>
              {SERVICE_PUBLICATION_DURATION_DAYS} días
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Estado
            </Text>

            <Text style={styles.pendingValue}>
              Pendiente de pago
            </Text>
          </View>
        </View>

        <View style={styles.successNotice}>
          <Text style={styles.successNoticeTitle}>
            Los 30 días todavía no comenzaron
          </Text>

          <Text style={styles.successNoticeText}>
            El período de publicación comienza recién cuando el pago
            sea aprobado y el servicio sea activado.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={resetFlow}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed &&
              styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            Publicar otro servicio
          </Text>
        </Pressable>

        {onExit && (
          <Pressable
            accessibilityRole="button"
            onPress={onExit}
            style={({ pressed }) => [
              styles.secondaryFullButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Cambiar tipo de publicación
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.flowHeader}>
        <View style={styles.flowHeaderTop}>
          <View style={styles.flowHeaderContent}>
            <Text style={styles.flowEyebrow}>
              PUBLICAR SERVICIO
            </Text>

            <Text style={styles.flowTitle}>
              Perfil profesional
            </Text>
          </View>

          {onExit && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar tipo de publicación"
              disabled={isPublishing}
              onPress={onExit}
              hitSlop={10}
              style={({ pressed }) => [
                styles.exitButton,
                isPublishing &&
                  styles.disabled,
                pressed &&
                  !isPublishing &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.exitButtonText
                }
              >
                Cambiar
              </Text>
            </Pressable>
          )}
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: 4,
            now: step,
            text: `Paso ${step} de 4`,
          }}
          style={styles.progressSection}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressStep}>
              Paso {step} de 4
            </Text>

            <Text style={styles.progressLabel}>
              {STEP_LABELS[step]}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    progressWidth,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {validationError && (
        <View
          accessibilityRole="alert"
          style={styles.errorCard}
        >
          <Text style={styles.errorTitle}>
            Revisá esta información
          </Text>

          <Text style={styles.errorText}>
            {validationError}
          </Text>
        </View>
      )}

      <View style={styles.stepCard}>
        {step === 1 && (
          <ServiceProfessionalStep
            title={title}
            category={category}
            specialty={specialty}
            description={description}
            keywords={keywords}
            disabled={
              disabled ||
              isPublishing
            }
            onTitleChange={
              setTitle
            }
            onCategoryChange={
              setCategory
            }
            onSpecialtyChange={
              setSpecialty
            }
            onDescriptionChange={
              setDescription
            }
            onKeywordsChange={
              setKeywords
            }
          />
        )}

        {step === 2 && (
          <ServicePricingStep
            priceType={priceType}
            price={price}
            experienceYears={
              experienceYears
            }
            responseTime={
              responseTime
            }
            disabled={
              disabled ||
              isPublishing
            }
            onPriceTypeChange={
              setPriceType
            }
            onPriceChange={
              setPrice
            }
            onExperienceYearsChange={
              setExperienceYears
            }
            onResponseTimeChange={
              setResponseTime
            }
          />
        )}

        {step === 3 && (
          <ServiceLocationContactStep
            city={city}
            province={province}
            zones={zones}
            whatsapp={whatsapp}
            phone={phone}
            disabled={
              disabled ||
              isPublishing
            }
            onCityChange={
              setCity
            }
            onProvinceChange={
              setProvince
            }
            onZonesChange={
              setZones
            }
            onWhatsappChange={
              setWhatsapp
            }
            onPhoneChange={
              setPhone
            }
          />
        )}

        {step === 4 && (
          <View style={styles.confirmationContent}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmEyebrow}>
                ÚLTIMO PASO
              </Text>

              <Text style={styles.confirmTitle}>
                Revisá y enviá tu solicitud
              </Text>

              <Text style={styles.confirmDescription}>
                Las imágenes son opcionales. Podés agregarlas antes
                de enviar el servicio.
              </Text>
            </View>

            <ServiceImagePicker
              images={images}
              onImagesChange={
                setImages
              }
              disabled={
                disabled ||
                isPublishing
              }
            />

            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>
                Resumen del servicio
              </Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Título
                </Text>

                <Text style={styles.summaryValue}>
                  {title.trim()}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Categoría
                </Text>

                <Text style={styles.summaryValue}>
                  {category}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Especialidad
                </Text>

                <Text style={styles.summaryValue}>
                  {specialty.trim()}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Precio
                </Text>

                <Text style={styles.summaryValue}>
                  {priceSummary}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Modalidad
                </Text>

                <Text style={styles.summaryValue}>
                  {getPriceTypeLabel(
                    priceType,
                  )}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Experiencia
                </Text>

                <Text style={styles.summaryValue}>
                  {experienceSummary}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Respuesta
                </Text>

                <Text style={styles.summaryValue}>
                  {getResponseTimeLabel(
                    responseTime,
                  )}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Ciudad
                </Text>

                <Text style={styles.summaryValue}>
                  {[
                    city.trim(),
                    province.trim(),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Imágenes
                </Text>

                <Text style={styles.summaryValue}>
                  {images.length === 0
                    ? "Sin imágenes"
                    : `${images.length} ${
                        images.length === 1
                          ? "imagen"
                          : "imágenes"
                      }`}
                </Text>
              </View>
            </View>

            <View style={styles.paymentCard}>
              <Text style={styles.paymentEyebrow}>
                PUBLICACIÓN PROFESIONAL
              </Text>

              <Text style={styles.paymentPrice}>
                {publicationPriceLabel}
              </Text>

              <Text style={styles.paymentPeriod}>
                por {SERVICE_PUBLICATION_DURATION_DAYS} días
              </Text>

              <Text style={styles.paymentDescription}>
                Al enviar, el servicio quedará pendiente de pago y no
                se activará automáticamente. Los{" "}
                {SERVICE_PUBLICATION_DURATION_DAYS} días empiezan
                únicamente después de que Eziel confirme el pago.
              </Text>
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{
                checked:
                  acceptedPublication,
                disabled:
                  disabled ||
                  isPublishing,
              }}
              disabled={
                disabled ||
                isPublishing
              }
              onPress={() => {
                setAcceptedPublication(
                  (current) =>
                    !current,
                );

                setValidationError(
                  null,
                );
              }}
              style={({ pressed }) => [
                styles.confirmCheck,
                acceptedPublication &&
                  styles.confirmCheckSelected,
                pressed &&
                  !disabled &&
                  !isPublishing &&
                  styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedPublication &&
                    styles.checkboxSelected,
                ]}
              >
                {acceptedPublication && (
                  <Text style={styles.checkboxMark}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.confirmCheckText}>
                Entiendo que la publicación cuesta{" "}
                <Text style={styles.confirmCheckStrong}>
                  {publicationPriceLabel}
                </Text>{" "}
                por{" "}
                <Text style={styles.confirmCheckStrong}>
                  {SERVICE_PUBLICATION_DURATION_DAYS} días
                </Text>{" "}
                y que quedará pendiente hasta confirmar el pago.
              </Text>
            </Pressable>

            {!isAuthenticated && (
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>
                  Necesitás iniciar sesión
                </Text>

                <Text style={styles.authDescription}>
                  Tu información no se enviará hasta que tengas una
                  sesión válida de Eziel.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={
                    handleRequestAuthentication
                  }
                  style={({ pressed }) => [
                    styles.authButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text style={styles.authButtonText}>
                    Iniciar sesión
                  </Text>
                </Pressable>
              </View>
            )}

            {isPublishing && (
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: uploadPercent,
                  text: `${uploadPercent}%`,
                }}
                style={styles.uploadCard}
              >
                <View style={styles.uploadHeader}>
                  <Text style={styles.uploadTitle}>
                    {images.length > 0 &&
                    uploadProgress < 1
                      ? "Subiendo imágenes"
                      : "Creando solicitud"}
                  </Text>

                  {images.length > 0 && (
                    <Text style={styles.uploadPercent}>
                      {uploadPercent}%
                    </Text>
                  )}
                </View>

                {images.length > 0 && (
                  <View style={styles.uploadTrack}>
                    <View
                      style={[
                        styles.uploadFill,
                        {
                          width:
                            uploadWidth,
                        },
                      ]}
                    />
                  </View>
                )}

                <Text style={styles.uploadDescription}>
                  No cierres Eziel hasta que termine el proceso.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.navigation}>
        {step > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled:
                isPublishing ||
                disabled,
            }}
            disabled={
              isPublishing ||
              disabled
            }
            onPress={() =>
              goToStep(
                (step - 1) as ServiceFlowStep,
              )
            }
            style={({ pressed }) => [
              styles.secondaryButton,
              (isPublishing ||
                disabled) &&
                styles.disabled,
              pressed &&
                !isPublishing &&
                !disabled &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Atrás
            </Text>
          </Pressable>
        ) : (
          onExit && (
            <Pressable
              accessibilityRole="button"
              disabled={
                isPublishing ||
                disabled
              }
              onPress={onExit}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Atrás
              </Text>
            </Pressable>
          )
        )}

        {step === 1 && (
          <Pressable
            accessibilityRole="button"
            onPress={
              handleContinueFromProfessional
            }
            disabled={
              isPublishing ||
              disabled
            }
            style={({ pressed }) => [
              styles.primaryNavigationButton,
              (isPublishing ||
                disabled) &&
                styles.disabled,
              pressed &&
                !isPublishing &&
                !disabled &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Continuar
            </Text>
          </Pressable>
        )}

        {step === 2 && (
          <Pressable
            accessibilityRole="button"
            onPress={
              handleContinueFromPricing
            }
            disabled={
              isPublishing ||
              disabled
            }
            style={({ pressed }) => [
              styles.primaryNavigationButton,
              (isPublishing ||
                disabled) &&
                styles.disabled,
              pressed &&
                !isPublishing &&
                !disabled &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Continuar
            </Text>
          </Pressable>
        )}

        {step === 3 && (
          <Pressable
            accessibilityRole="button"
            onPress={
              handleContinueFromLocation
            }
            disabled={
              isPublishing ||
              disabled
            }
            style={({ pressed }) => [
              styles.primaryNavigationButton,
              (isPublishing ||
                disabled) &&
                styles.disabled,
              pressed &&
                !isPublishing &&
                !disabled &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Revisar solicitud
            </Text>
          </Pressable>
        )}

        {step === 4 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isAuthenticated
                ? "Enviar solicitud de publicación del servicio"
                : "Iniciar sesión para continuar"
            }
            accessibilityState={{
              disabled:
                isAuthenticated &&
                (!acceptedPublication ||
                  !allRequiredDataReady ||
                  isPublishing ||
                  disabled),
              busy:
                isPublishing,
            }}
            disabled={
              isAuthenticated &&
              (!acceptedPublication ||
                !allRequiredDataReady ||
                isPublishing ||
                disabled)
            }
            onPress={
              isAuthenticated
                ? handlePublish
                : handleRequestAuthentication
            }
            style={({ pressed }) => [
              styles.primaryNavigationButton,
              isAuthenticated &&
                (!acceptedPublication ||
                  !allRequiredDataReady ||
                  isPublishing ||
                  disabled) &&
                styles.primaryDisabled,
              pressed &&
                !isPublishing &&
                styles.primaryButtonPressed,
            ]}
          >
            {isPublishing && (
              <ActivityIndicator
                size="small"
                color={SURFACE}
              />
            )}

            <Text
              style={[
                styles.primaryButtonText,
                isAuthenticated &&
                  (!acceptedPublication ||
                    !allRequiredDataReady ||
                    disabled) &&
                  styles.primaryDisabledText,
              ]}
            >
              {isPublishing
                ? "Enviando..."
                : isAuthenticated
                  ? "Enviar solicitud"
                  : "Iniciar sesión"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },

  flowHeader: {
    gap: 17,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 22,
    backgroundColor: SURFACE,
    padding: 17,
  },

  flowHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  flowHeaderContent: {
    flex: 1,
    gap: 3,
  },

  flowEyebrow: {
    color: ORANGE_DARK,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  flowTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "900",
  },

  exitButton: {
    minHeight: 36,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 999,
    backgroundColor: ORANGE_SOFT,
    paddingHorizontal: 13,
  },

  exitButtonText: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "800",
  },

  progressSection: {
    gap: 8,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressStep: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
  },

  progressLabel: {
    color: TEXT,
    fontSize: 11,
    fontWeight: "800",
  },

  progressTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  errorCard: {
    borderWidth: 1,
    borderColor: DANGER_BORDER,
    borderRadius: 18,
    backgroundColor: DANGER_SOFT,
    padding: 14,
  },

  errorTitle: {
    color: DANGER,
    fontSize: 12,
    fontWeight: "900",
  },

  errorText: {
    color: DANGER,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  stepCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 24,
    backgroundColor: SURFACE,
    padding: 18,
  },

  confirmationContent: {
    gap: 24,
  },

  confirmHeader: {
    gap: 5,
  },

  confirmEyebrow: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  confirmTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
  },

  confirmDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  reviewCard: {
    gap: 13,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: BACKGROUND,
    padding: 16,
  },

  reviewTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 2,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },

  summaryLabel: {
    flexShrink: 0,
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
  },

  summaryValue: {
    flex: 1,
    color: TEXT,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },

  pendingValue: {
    flex: 1,
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
  },

  paymentCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 22,
    backgroundColor: ORANGE_SOFT,
    padding: 20,
  },

  paymentEyebrow: {
    color: ORANGE_DARK,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  paymentPrice: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 7,
  },

  paymentPeriod: {
    color: ORANGE_DARK,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },

  paymentDescription: {
    maxWidth: 340,
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 11,
  },

  confirmCheck: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    backgroundColor: SURFACE,
    padding: 15,
  },

  confirmCheckSelected: {
    borderColor: ORANGE_BORDER,
    backgroundColor: ORANGE_SOFT,
  },

  checkbox: {
    width: 23,
    height: 23,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: MUTED_LIGHT,
    borderRadius: 7,
    backgroundColor: SURFACE,
  },

  checkboxSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },

  checkboxMark: {
    color: SURFACE,
    fontSize: 14,
    fontWeight: "900",
  },

  confirmCheckText: {
    flex: 1,
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
  },

  confirmCheckStrong: {
    color: TEXT,
    fontWeight: "900",
  },

  authCard: {
    gap: 7,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
    padding: 15,
  },

  authTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
  },

  authDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
  },

  authButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: ORANGE,
    paddingHorizontal: 15,
    marginTop: 3,
  },

  authButtonText: {
    color: SURFACE,
    fontSize: 12,
    fontWeight: "900",
  },

  uploadCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    borderRadius: 18,
    backgroundColor: ORANGE_SOFT,
    padding: 15,
  },

  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  uploadTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },

  uploadPercent: {
    color: ORANGE_DARK,
    fontSize: 11,
    fontWeight: "900",
  },

  uploadTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: ORANGE_BORDER,
  },

  uploadFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ORANGE,
  },

  uploadDescription: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
  },

  navigation: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    minHeight: 54,
    minWidth: 105,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    backgroundColor: SURFACE,
    paddingHorizontal: 17,
  },

  secondaryFullButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    backgroundColor: SURFACE,
    paddingHorizontal: 17,
  },

  secondaryButtonText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  primaryNavigationButton: {
    flex: 1,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 17,
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
  },

  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
  },

  primaryButtonText: {
    color: SURFACE,
    fontSize: 13,
    fontWeight: "900",
  },

  primaryButtonPressed: {
    backgroundColor: ORANGE_DARK,
  },

  primaryDisabled: {
    backgroundColor: "#E2E8F0",
  },

  primaryDisabledText: {
    color: MUTED_LIGHT,
  },

  successContainer: {
    alignItems: "center",
    gap: 15,
    borderWidth: 1,
    borderColor: SUCCESS_BORDER,
    borderRadius: 26,
    backgroundColor: SURFACE,
    padding: 22,
  },

  successIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: SUCCESS_SOFT,
  },

  successIconText: {
    color: SUCCESS,
    fontSize: 30,
    fontWeight: "900",
  },

  successEyebrow: {
    color: SUCCESS,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  successTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  successDescription: {
    maxWidth: 360,
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  successSummary: {
    width: "100%",
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 19,
    backgroundColor: BACKGROUND,
    padding: 16,
  },

  successNotice: {
    width: "100%",
    borderWidth: 1,
    borderColor: SUCCESS_BORDER,
    borderRadius: 18,
    backgroundColor: SUCCESS_SOFT,
    padding: 15,
  },

  successNoticeTitle: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: "900",
  },

  successNoticeText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.72,
  },
});
