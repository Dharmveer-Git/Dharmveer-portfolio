const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SETTINGS_SECTION_KEYS = [
  "about",
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
  "profiles",
  "services",
  "contact",
];

const FOOTER_LINK_KEYS = [
  "email",
  "whatsapp",
  "github",
  "linkedin",
  "indeed",
  "upwork",
  "turing",
  "facebook",
  "youtube",
  "leetcode",
  "hackerrank",
];

const FOOTER_SECTION_KEYS = [
  "identity",
  "quickLinks",
  "professional",
  "socialRow",
  "copyright",
  "privacy",
  "backToTop",
];

// Custom validation error
export class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputValidationError";
  }
}

// Validate boolean values
function boolean(value, fallback = false) {
  if (value === undefined) return fallback;

  if (typeof value !== "boolean") {
    throw new InputValidationError(
      "Visibility and status fields must be true or false."
    );
  }

  return value;
}

// Convert value to trimmed text with maximum length
const text = (value, maxLength) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

// Validate and limit string arrays
const stringList = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => text(item, 100))
    .filter(Boolean)
    .slice(0, 40);

// Normalize and validate URLs
export function normalizeUrl(
  value,
  { allowMailto = false, allowRelative = true } = {}
) {
  const input = text(value, 2_048);

  if (!input) return "";

  // Block backslashes and control characters
  if (
    [...input].some(
      (character) =>
        character === "\\" ||
        character.charCodeAt(0) < 32 ||
        character.charCodeAt(0) === 127
    )
  ) {
    throw new InputValidationError(
      "URL contains invalid characters."
    );
  }

  // Allow relative URLs such as /uploads/image.jpg
  if (allowRelative && input.startsWith("/") && !input.startsWith("//")) {
    return input;
  }

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new InputValidationError("Enter a valid URL.");
  }

  const protocols = allowMailto
    ? ["http:", "https:", "mailto:"]
    : ["http:", "https:"];

  if (!protocols.includes(parsed.protocol)) {
    throw new InputValidationError(
      "URL protocol is not allowed."
    );
  }

  return parsed.toString();
}

// Normalize email footer link
function normalizeEmailLink(value) {
  const input = text(value, 2_048);

  if (!input) return "";

  const address = input
    .replace(/^mailto:/i, "")
    .trim()
    .toLowerCase();

  if (!EMAIL_PATTERN.test(address)) {
    throw new InputValidationError(
      "Enter a valid footer email address."
    );
  }

  return `mailto:${address}`;
}

// Normalize WhatsApp link
function normalizeWhatsAppLink(value) {
  const input = text(value, 2_048);

  if (!input) return "";

  let number = input.replace(/\D/g, "");

  if (/^https?:/i.test(input)) {
    let parsed;

    try {
      parsed = new URL(input);
    } catch {
      throw new InputValidationError(
        "Enter a valid WhatsApp link."
      );
    }

    if (
      parsed.protocol !== "https:" ||
      parsed.hostname.toLowerCase() !== "wa.me"
    ) {
      throw new InputValidationError(
        "WhatsApp must use an https://wa.me/ link."
      );
    }

    number = parsed.pathname.replace(/\D/g, "");
  }

  if (number.length < 7 || number.length > 15) {
    throw new InputValidationError(
      "Enter a valid WhatsApp number with country code."
    );
  }

  return `https://wa.me/${number}`;
}

// Normalize navigation links
function normalizeNavLinks(value) {
  const input = text(value, 2_000);

  if (!input) return "";

  return input
    .split(",")
    .map((entry) => {
      const [rawLabel, rawTarget, ...extra] = entry.split("|");

      const label = text(rawLabel, 80);
      const target = text(rawTarget, 2_048);

      if (!label || !target || extra.length) {
        throw new InputValidationError(
          "Each navigation link must use Label|Target format."
        );
      }

      // Allow internal section links like #about
      if (target.startsWith("#")) {
        if (!/^#[a-z][a-z0-9_-]*$/i.test(target)) {
          throw new InputValidationError(
            "Enter a valid navigation section target."
          );
        }

        return `${label}|${target}`;
      }

      return `${label}|${normalizeUrl(target)}`;
    })
    .join(",");
}

// Sanitize footer settings
function sanitizeFooterInput(input = {}, current = {}) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new InputValidationError("Footer must be an object.");
  }

  const currentLinks = current.links || {};

  const inputLinks =
    input.links && typeof input.links === "object"
      ? input.links
      : {};

  const links = Object.fromEntries(
    FOOTER_LINK_KEYS.map((key) => {
      const currentLink = currentLinks[key] || {};

      const candidate =
        inputLinks[key] &&
        typeof inputLinks[key] === "object"
          ? inputLinks[key]
          : currentLink;

      const label = text(
        candidate.label ?? currentLink.label ?? key,
        80
      );

      let url = candidate.url ?? currentLink.url ?? "";

      if (key === "email") {
        url = normalizeEmailLink(url);
      } else if (key === "whatsapp") {
        url = normalizeWhatsAppLink(url);
      } else {
        url = normalizeUrl(url, {
          allowRelative: false,
        });
      }

      return [
        key,
        {
          label,
          url,
          visible: boolean(
            candidate.visible,
            currentLink.visible ?? true
          ),
        },
      ];
    })
  );

  const sections = {
    ...(current.sections || {}),
  };

  const requestedSections =
    input.sections &&
    typeof input.sections === "object"
      ? input.sections
      : {};

  for (const key of FOOTER_SECTION_KEYS) {
    if (requestedSections[key] !== undefined) {
      sections[key] = boolean(requestedSections[key]);
    }
  }

  return {
    developerName: text(
      input.developerName ?? current.developerName,
      120
    ),
    shortDescription: text(
      input.shortDescription ?? current.shortDescription,
      500
    ),
    logoUrl: normalizeUrl(
      input.logoUrl ?? current.logoUrl
    ),
    logoAlt: text(
      input.logoAlt ?? current.logoAlt,
      160
    ),
    quickLinksHeading: text(
      input.quickLinksHeading ?? current.quickLinksHeading,
      80
    ),
    professionalHeading: text(
      input.professionalHeading ?? current.professionalHeading,
      80
    ),
    links,
    copyrightText: text(
      input.copyrightText ?? current.copyrightText,
      200
    ),
    useCurrentYear: boolean(
      input.useCurrentYear,
      current.useCurrentYear ?? true
    ),
    privacyLabel: text(
      input.privacyLabel ?? current.privacyLabel,
      80
    ),
    privacyUrl: normalizeUrl(
      input.privacyUrl ?? current.privacyUrl
    ),
    sections,
  };
}

// Sanitize content data
export function sanitizeContentInput(
  body = {},
  resource = ""
) {
  const title = text(body.title, 160);

  if (!title) {
    throw new InputValidationError("Title is required.");
  }

  const metaInput =
    body.meta &&
    typeof body.meta === "object" &&
    !Array.isArray(body.meta)
      ? body.meta
      : {};

  const meta = Object.fromEntries(
    [
      "headline",
      "problem",
      "solution",
      "learning",
      "enabled",
    ]
      .filter((key) => metaInput[key] !== undefined)
      .map((key) => [
        key,
        key === "enabled"
          ? boolean(metaInput[key])
          : text(metaInput[key], 2_000),
      ])
  );

  let primaryUrl = body.url;

  if (
    resource === "socials" &&
    title.toLowerCase() === "email"
  ) {
    primaryUrl = normalizeEmailLink(body.url);
  } else if (
    resource === "socials" &&
    title.toLowerCase() === "whatsapp"
  ) {
    primaryUrl = normalizeWhatsAppLink(body.url);
  } else {
    primaryUrl = normalizeUrl(body.url, {
      allowMailto: false,
    });
  }

  return {
    title,
    subtitle: text(body.subtitle, 240),
    description: text(body.description, 5_000),
    headline: text(body.headline, 240),
    image: normalizeUrl(body.image),
    url: primaryUrl,
    githubUrl: normalizeUrl(body.githubUrl),
    liveUrl: normalizeUrl(body.liveUrl),
    startDate: text(body.startDate, 80),
    endDate: text(body.endDate, 80),
    location: text(body.location, 160),
    tags: stringList(body.tags),
    features: stringList(body.features),
    meta,
    order: Math.max(
      0,
      Number.isFinite(Number(body.order))
        ? Number(body.order)
        : 0
    ),
    active: boolean(body.active, true),
    featured: boolean(body.featured, false),
  };
}

// Sanitize contact/message data
export function sanitizeMessageInput(body = {}) {
  const result = {
    name: text(body.name, 80),
    email: text(body.email, 254).toLowerCase(),
    company: text(body.company, 120),
    subject: text(body.subject, 160),
    message: text(body.message, 3_000),
  };

  if (
    !result.name ||
    !result.subject ||
    !result.message ||
    !EMAIL_PATTERN.test(result.email)
  ) {
    throw new InputValidationError(
      "Name, valid email, subject, and message are required."
    );
  }

  return result;
}

// Sanitize site settings
export function sanitizeSettingsInput(
  body = {},
  current = {}
) {
  const sections = {
    ...(current.sections || {}),
  };

  if (
    body.sections &&
    typeof body.sections === "object" &&
    !Array.isArray(body.sections)
  ) {
    for (const key of SETTINGS_SECTION_KEYS) {
      if (body.sections[key] !== undefined) {
        sections[key] = boolean(body.sections[key]);
      }
    }
  }

  return {
    logoName: text(
      body.logoName ?? current.logoName,
      80
    ),
    hireMeText: text(
      body.hireMeText ?? current.hireMeText,
      80
    ),
    copyrightText: text(
      body.copyrightText ?? current.copyrightText,
      160
    ),
    navLinks: normalizeNavLinks(
      body.navLinks ?? current.navLinks
    ),
    defaultTheme:
      (body.defaultTheme ?? current.defaultTheme) === "light"
        ? "light"
        : "dark",
    resumeUrl: normalizeUrl(
      body.resumeUrl ?? current.resumeUrl
    ),
    pageTitle: text(
      body.pageTitle ?? current.pageTitle,
      70
    ),
    metaDescription: text(
      body.metaDescription ?? current.metaDescription,
      170
    ),
    keywords: text(
      body.keywords ?? current.keywords,
      500
    ),
    ogImage: normalizeUrl(
      body.ogImage ?? current.ogImage
    ),
    sections,
    footer: sanitizeFooterInput(
      body.footer,
      current.footer
    ),
  };
}