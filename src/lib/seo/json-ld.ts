export interface BreadcrumbItem {
  name: string;
  item: string;
}

// Clean HTML tags and double spaces from description strings
export function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Helper to compile a valid schema.org BreadcrumbList
export function getBreadcrumbListSchema(
  siteUrl: string,
  items: BreadcrumbItem[]
) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "BreadcrumbList" as const,
    "itemListElement": items.map((it, idx) => ({
      "@type": "ListItem" as const,
      "position": idx + 1,
      "name": it.name,
      "item": it.item.startsWith('http') ? it.item : `${siteUrl}${it.item}`
    }))
  };
}

// Home page schemas (WebSite and Organization)
export function getHomeJsonLd(siteUrl: string) {
  const website = {
    "@context": "https://schema.org" as const,
    "@type": "WebSite" as const,
    "@id": `${siteUrl}/#website`,
    "url": siteUrl,
    "name": "La Gauchita Federal",
    "description": "Portal federal de historia, cultura, instituciones, reconocimientos y archivo del patrimonio cultural argentino.",
    "potentialAction": {
      "@type": "SearchAction" as const,
      "target": {
        "@type": "EntryPoint" as const,
        "urlTemplate": `${siteUrl}/buscar?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organization = {
    "@context": "https://schema.org" as const,
    "@type": "Organization" as const,
    "@id": `${siteUrl}/#organization`,
    "name": "La Gauchita Federal",
    "url": siteUrl
  };

  return [website, organization];
}

// Acerca page schemas (Organization and BreadcrumbList)
export function getAcercaJsonLd(siteUrl: string) {
  const organization = {
    "@context": "https://schema.org" as const,
    "@type": "Organization" as const,
    "@id": `${siteUrl}/#organization`,
    "name": "La Gauchita Federal",
    "url": siteUrl
  };

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Acerca de", item: "/acerca" }
  ]);

  return [organization, breadcrumbs];
}

// Contents detail page schemas (Article and BreadcrumbList)
export function getArticleJsonLd(
  siteUrl: string,
  content: {
    title: string;
    slug: string;
    summary: string | null;
    subtitle: string | null;
    publish_date: string | null;
    created_at: string | null;
    categories?: { name: string } | null;
    institutions?: { name: string } | null;
  },
  imageUrl?: string | null
) {
  const cleanDescription = cleanText(content.summary || content.subtitle);
  
  const article: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/contenidos/${content.slug}`
    },
    "headline": content.title,
    "description": cleanDescription || undefined,
    "publisher": {
      "@type": "Organization",
      "name": "La Gauchita Federal",
      "url": siteUrl
    }
  };

  if (content.publish_date) {
    article.datePublished = new Date(content.publish_date).toISOString();
  }
  if (content.created_at) {
    article.dateModified = new Date(content.created_at).toISOString();
  }

  if (content.institutions?.name) {
    article.author = {
      "@type": "Organization",
      "name": content.institutions.name
    };
  } else {
    article.author = {
      "@type": "Organization",
      "name": "La Gauchita Federal"
    };
  }

  if (imageUrl) {
    article.image = [imageUrl];
  }

  if (content.categories?.name) {
    article.articleSection = content.categories.name;
  }

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Historias y cultura", item: "/contenidos" },
    { name: content.title, item: `/contenidos/${content.slug}` }
  ]);

  return [article, breadcrumbs];
}

// Characters detail page schemas (Person and BreadcrumbList)
export function getPersonJsonLd(
  siteUrl: string,
  person: {
    full_name: string;
    slug: string;
    short_bio: string | null;
    birth_date: string | null;
    death_date: string | null;
    provinces?: { name: string } | null;
    municipalities?: { name: string } | null;
  },
  imageUrl?: string | null
) {
  const cleanDescription = cleanText(person.short_bio);
  
  const personSchema: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": person.full_name,
    "description": cleanDescription || undefined,
    "url": `${siteUrl}/personajes/${person.slug}`
  };

  if (person.birth_date) {
    personSchema.birthDate = person.birth_date;
  }
  if (person.death_date) {
    personSchema.deathDate = person.death_date;
  }

  if (imageUrl) {
    personSchema.image = imageUrl;
  }

  let originName = '';
  if (person.municipalities?.name) {
    originName = `${person.municipalities.name}, ${person.provinces?.name || ''}`;
  } else if (person.provinces?.name) {
    originName = person.provinces.name;
  }

  if (originName) {
    personSchema.birthPlace = {
      "@type": "Place",
      "name": originName
    };
  }

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Personajes", item: "/personajes" },
    { name: person.full_name, item: `/personajes/${person.slug}` }
  ]);

  return [personSchema, breadcrumbs];
}

// Institutions detail page schemas (Organization and BreadcrumbList)
export function getInstitutionJsonLd(
  siteUrl: string,
  inst: {
    name: string;
    slug: string;
    description: string | null;
    website_url?: string | null;
  },
  imageUrl?: string | null
) {
  const cleanDescription = cleanText(inst.description);

  const orgSchema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": inst.name,
    "description": cleanDescription || undefined,
    "url": `${siteUrl}/instituciones/${inst.slug}`
  };

  if (imageUrl) {
    orgSchema.logo = imageUrl;
  }

  if (inst.website_url) {
    orgSchema.sameAs = [inst.website_url];
  }

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Instituciones", item: "/instituciones" },
    { name: inst.name, item: `/instituciones/${inst.slug}` }
  ]);

  return [orgSchema, breadcrumbs];
}

// Recognitions detail page schemas (CreativeWork and BreadcrumbList)
export function getRecognitionJsonLd(
  siteUrl: string,
  r: {
    title: string;
    slug: string;
    description: string | null;
    recognition_type: string;
    granting_institution_name: string | null;
    recognition_date: string | null;
  }
) {
  const cleanDescription = cleanText(r.description);

  const workSchema: any = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": r.title,
    "description": cleanDescription || undefined,
    "url": `${siteUrl}/reconocimientos/${r.slug}`,
    "genre": r.recognition_type
  };

  if (r.recognition_date) {
    workSchema.datePublished = r.recognition_date;
  }

  if (r.granting_institution_name) {
    workSchema.publisher = {
      "@type": "Organization",
      "name": r.granting_institution_name
    };
  }

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Reconocimientos", item: "/reconocimientos" },
    { name: r.title, item: `/reconocimientos/${r.slug}` }
  ]);

  return [workSchema, breadcrumbs];
}

// Magazine editions detail page schemas (PublicationIssue and BreadcrumbList)
export function getMagazineJsonLd(
  siteUrl: string,
  edition: {
    title: string;
    slug: string;
    edition_number: number;
    volume: string | null;
    publication_year: number;
    publication_date: string | null;
    description: string | null;
  },
  imageUrl?: string | null
) {
  const cleanDescription = cleanText(edition.description);

  const issueSchema: any = {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    "name": edition.title,
    "issueNumber": String(edition.edition_number),
    "description": cleanDescription || undefined,
    "isPartOf": {
      "@type": "CreativeWorkSeries",
      "name": "Revista La Gauchita",
      "publisher": {
        "@type": "Organization",
        "name": "La Gauchita Federal",
        "url": siteUrl
      }
    }
  };

  if (edition.publication_date) {
    issueSchema.datePublished = edition.publication_date;
  } else {
    issueSchema.datePublished = String(edition.publication_year);
  }

  if (imageUrl) {
    issueSchema.image = imageUrl;
  }

  const breadcrumbs = getBreadcrumbListSchema(siteUrl, [
    { name: "Inicio", item: "/" },
    { name: "Revista", item: "/revista" },
    { name: edition.title, item: `/revista/${edition.slug}` }
  ]);

  return [issueSchema, breadcrumbs];
}
