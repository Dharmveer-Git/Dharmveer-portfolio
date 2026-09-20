import mongoose from "mongoose";

// Default visibility of portfolio sections
export const DEFAULT_SECTIONS = {
  about: true,
  skills: true,
  projects: true,
  experience: true,
  education: true,
  certificates: true,
  profiles: true,
  services: true,
  contact: true,
};

// Creates a default footer link
const footerLink = (label) => ({
  label,
  url: "",
  visible: true,
});

// Default footer configuration
export const DEFAULT_FOOTER = {
  developerName: "Dharmveer Kumar",

  shortDescription:
    "I build fast, accessible, and dependable web products, from polished interfaces to secure backend systems.",

  logoUrl: "",
  logoAlt: "Dharmveer Kumar logo",

  quickLinksHeading: "Quick Links",
  professionalHeading: "Professional",

  // Footer links
  links: {
    email: footerLink("Email"),
    whatsapp: footerLink("WhatsApp"),
    github: footerLink("GitHub"),
    linkedin: footerLink("LinkedIn"),
    indeed: footerLink("Indeed"),
    upwork: footerLink("Upwork"),
    turing: footerLink("Turing"),
    facebook: footerLink("Facebook"),
    youtube: footerLink("YouTube"),
    leetcode: footerLink("LeetCode"),
    hackerrank: footerLink("HackerRank"),
  },

  copyrightText: "Dharmveer Kumar",
  useCurrentYear: true,

  privacyLabel: "Privacy",
  privacyUrl: "/privacy",

  // Controls which footer sections are visible
  sections: {
    identity: true,
    quickLinks: true,
    professional: true,
    socialRow: true,
    copyright: true,
    privacy: true,
    backToTop: true,
  },
};

// Default website settings
export const DEFAULT_SETTINGS = {
  logoName: "DK.",
  hireMeText: "Hire me",
  copyrightText: "Dharmveer Kumar",

  navLinks:
    "Home|#top,About|#about,Skills|#skills,Projects|#work,Experience|#experience,Education|#education,Contact|#contact",

  defaultTheme: "dark",

  resumeUrl: "/resume.pdf",

  pageTitle: "Dharmveer Kumar | Full Stack Developer",

  metaDescription:
    "Full Stack Developer specializing in React, Node.js, MongoDB, Java and Spring Boot.",

  keywords: "",
  ogImage: "",

  sections: DEFAULT_SECTIONS,
  footer: DEFAULT_FOOTER,
};

// Site settings schema
const siteSettingsSchema = new mongoose.Schema(
  {
    // Ensures only one site-settings document exists
    singletonKey: {
      type: String,
      default: "site-settings",
      immutable: true,
      unique: true,
      enum: ["site-settings"],
    },

    // Website logo/name
    logoName: {
      type: String,
      trim: true,
      maxlength: 80,
      default: DEFAULT_SETTINGS.logoName,
    },

    // Hire Me button text
    hireMeText: {
      type: String,
      trim: true,
      maxlength: 80,
      default: DEFAULT_SETTINGS.hireMeText,
    },

    // Copyright text
    copyrightText: {
      type: String,
      trim: true,
      maxlength: 160,
      default: DEFAULT_SETTINGS.copyrightText,
    },

    // Navigation links configuration
    navLinks: {
      type: String,
      trim: true,
      maxlength: 2_000,
      default: DEFAULT_SETTINGS.navLinks,
    },

    // Default website theme
    defaultTheme: {
      type: String,
      enum: ["light", "dark"],
      default: DEFAULT_SETTINGS.defaultTheme,
    },

    // Resume file URL
    resumeUrl: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: DEFAULT_SETTINGS.resumeUrl,
    },

    // SEO page title
    pageTitle: {
      type: String,
      trim: true,
      maxlength: 70,
      default: DEFAULT_SETTINGS.pageTitle,
    },

    // SEO meta description
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 170,
      default: DEFAULT_SETTINGS.metaDescription,
    },

    // SEO keywords
    keywords: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Open Graph image URL
    ogImage: {
      type: String,
      trim: true,
      maxlength: 2_048,
      default: "",
    },

    // Portfolio section visibility settings
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_SECTIONS }),
    },

    // Footer configuration
    footer: {
      type: mongoose.Schema.Types.Mixed,
      default: () => structuredClone(DEFAULT_FOOTER),
    },
  },
  {
    // Automatically adds createdAt and updatedAt
    timestamps: true,
  }
);

// Create and export the SiteSettings model
export default mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", siteSettingsSchema);