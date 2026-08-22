import type {
  ServicePriceType,
  ServiceResponseTime,
} from "./serviceTypes";

export const SERVICE_CATEGORIES = [
  "Hogar y construcción",
  "Profesionales",
  "Salud y bienestar",
  "Educación",
  "Tecnología",
  "Belleza",
  "Eventos",
  "Vehículos",
  "Transporte y mudanzas",
  "Comercios y empresas",
  "Otros",
] as const;

export type ServiceCategory =
  (typeof SERVICE_CATEGORIES)[number];

export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const SERVICE_CITY_SUGGESTIONS = [
  {
    city: "CABA",
    province: "Ciudad Autónoma de Buenos Aires",
  },
  {
    city: "Córdoba Capital",
    province: "Córdoba",
  },
  {
    city: "Rosario",
    province: "Santa Fe",
  },
  {
    city: "Mendoza Capital",
    province: "Mendoza",
  },
  {
    city: "La Plata",
    province: "Buenos Aires",
  },
  {
    city: "Mar del Plata",
    province: "Buenos Aires",
  },
  {
    city: "Neuquén Capital",
    province: "Neuquén",
  },
  {
    city: "Salta Capital",
    province: "Salta",
  },
  {
    city: "San Miguel de Tucumán",
    province: "Tucumán",
  },
  {
    city: "Santa Fe Capital",
    province: "Santa Fe",
  },
] as const;

export const SERVICE_SPECIALTIES_BY_CATEGORY: Record<
  ServiceCategory,
  readonly string[]
> = {
  "Hogar y construcción": [
    "Electricista",
    "Gasista matriculado",
    "Plomero",
    "Albañil",
    "Pintor",
    "Carpintero",
    "Técnico en refrigeración",
    "Mantenimiento general",
  ],

  Profesionales: [
    "Abogado laboral",
    "Abogado civil",
    "Contador",
    "Escribano",
    "Gestor",
    "Martillero",
    "Arquitecto",
    "Consultor",
  ],

  "Salud y bienestar": [
    "Psicólogo",
    "Nutricionista",
    "Kinesiólogo",
    "Entrenador personal",
    "Masajista",
    "Terapeuta",
  ],

  Educación: [
    "Profesor de inglés",
    "Profesor particular",
    "Apoyo escolar",
    "Clases de matemática",
    "Clases de programación",
    "Capacitación laboral",
  ],

  Tecnología: [
    "Soporte técnico",
    "Reparación de PC",
    "Reparación de celulares",
    "Diseño web",
    "Marketing digital",
    "Community manager",
  ],

  Belleza: [
    "Peluquería",
    "Manicuría",
    "Maquillaje",
    "Depilación",
    "Barbería",
    "Estética",
  ],

  Eventos: [
    "Fotógrafo",
    "Filmmaker",
    "DJ",
    "Catering",
    "Decoración de eventos",
    "Organización de eventos",
  ],

  Vehículos: [
    "Mecánico",
    "Lavadero",
    "Detailing",
    "Polarizado",
    "Auxilio mecánico",
    "Cerrajería automotor",
  ],

  "Transporte y mudanzas": [
    "Fletes",
    "Mudanzas",
    "Repartos",
    "Transporte de cargas",
    "Encomiendas",
  ],

  "Comercios y empresas": [
    "Servicio para empresas",
    "Proveedor comercial",
    "Mantenimiento comercial",
    "Consultoría comercial",
  ],

  Otros: [
    "Servicio general",
    "Asesoramiento",
    "Atención personalizada",
    "Trabajo a domicilio",
  ],
};

export const SERVICE_KEYWORDS_BY_CATEGORY: Record<
  ServiceCategory,
  readonly string[]
> = {
  "Hogar y construcción": [
    "urgencias",
    "reparaciones",
    "instalaciones",
    "mantenimiento",
    "a domicilio",
  ],

  Profesionales: [
    "asesoramiento",
    "consultas",
    "contratos",
    "trámites",
    "presencial",
    "online",
  ],

  "Salud y bienestar": [
    "turnos",
    "online",
    "presencial",
    "bienestar",
    "acompañamiento",
  ],

  Educación: [
    "clases online",
    "clases presenciales",
    "apoyo",
    "exámenes",
    "capacitación",
  ],

  Tecnología: [
    "soporte remoto",
    "reparación",
    "instalación",
    "diagnóstico",
    "mantenimiento",
  ],

  Belleza: [
    "turnos",
    "a domicilio",
    "promociones",
    "eventos",
    "atención personalizada",
  ],

  Eventos: [
    "casamientos",
    "cumpleaños",
    "empresas",
    "reservas",
    "producción",
  ],

  Vehículos: [
    "urgencias",
    "diagnóstico",
    "repuestos",
    "taller",
    "a domicilio",
  ],

  "Transporte y mudanzas": [
    "retiros",
    "entregas",
    "mudanzas",
    "cargas",
    "coordinación",
  ],

  "Comercios y empresas": [
    "empresas",
    "comercios",
    "proveedores",
    "mantenimiento",
    "atención comercial",
  ],

  Otros: [
    "servicio",
    "consultas",
    "presupuesto",
    "a domicilio",
    "online",
  ],
};

export interface ServicePriceTypeOption {
  value: ServicePriceType;
  label: string;
  description: string;
}

export const SERVICE_PRICE_TYPE_OPTIONS: readonly ServicePriceTypeOption[] = [
  {
    value: "fixed",
    label: "Precio fijo",
    description: "Un valor definido por el servicio.",
  },
  {
    value: "from",
    label: "Desde",
    description: "Indicá el precio mínimo.",
  },
  {
    value: "quote",
    label: "A consultar",
    description: "El precio se acuerda con cada cliente.",
  },
  {
    value: "hourly",
    label: "Por hora",
    description: "Indicá el valor de una hora de trabajo.",
  },
];

export interface ServiceResponseTimeOption {
  value: ServiceResponseTime;
  label: string;
}

export const SERVICE_RESPONSE_TIME_OPTIONS:
  readonly ServiceResponseTimeOption[] = [
    {
      value: "fast",
      label: "Rápida",
    },
    {
      value: "normal",
      label: "Normal",
    },
    {
      value: "slow",
      label: "Puede demorar",
    },
    {
      value: "unknown",
      label: "Sin especificar",
    },
  ];

export function normalizeServiceOptionText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatCommaList(items: readonly string[]): string {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const normalized = item.trim();

    if (!normalized) {
      continue;
    }

    const key = normalizeServiceOptionText(normalized);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result.join(", ");
}

export function isCommaItemSelected(
  value: string,
  item: string,
): boolean {
  const target = normalizeServiceOptionText(item);

  return parseCommaList(value).some(
    (current) =>
      normalizeServiceOptionText(current) === target,
  );
}

export function toggleCommaItem(
  value: string,
  item: string,
): string {
  const currentItems = parseCommaList(value);

  if (isCommaItemSelected(value, item)) {
    return formatCommaList(
      currentItems.filter(
        (current) =>
          normalizeServiceOptionText(current) !==
          normalizeServiceOptionText(item),
      ),
    );
  }

  return formatCommaList([
    ...currentItems,
    item,
  ]);
}

export function getServiceZoneSuggestions(
  city: string,
  province: string,
): string[] {
  const cleanCity = city.trim();
  const cleanProvince = province.trim();

  return Array.from(
    new Set(
      [
        cleanCity ? `Todo ${cleanCity}` : "",
        cleanCity ? `Centro de ${cleanCity}` : "",
        cleanCity ? `Zona norte de ${cleanCity}` : "",
        cleanCity ? `Zona sur de ${cleanCity}` : "",
        cleanProvince
          ? `Toda la provincia de ${cleanProvince}`
          : "",
        "Atención online",
        "A domicilio",
        "Todo el país",
      ].filter(Boolean),
    ),
  );
}
