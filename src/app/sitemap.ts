import { MetadataRoute } from 'next';
import {
  getPublishedContentsList,
  getActiveInstitutionsList,
  getActiveRecognitionsList
} from '../lib/public-content/public-content';
import { getPublishedPeople } from '../lib/public-content/public-people';
import { getPublishedMagazines } from '../lib/public-content/public-magazines';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/acerca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contenidos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/efemerides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/personajes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/instituciones`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/reconocimientos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/revista`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/archivo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/hoy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic contents sitemap
  let contentRoutes: MetadataRoute.Sitemap = [];
  try {
    const contents = await getPublishedContentsList();
    contentRoutes = contents.map((c) => ({
      url: `${siteUrl}/contenidos/${c.slug}`,
      lastModified: c.publish_date ? new Date(c.publish_date) : (c.created_at ? new Date(c.created_at) : new Date()),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (e) {
    console.error('Error generating sitemap content routes:', e);
  }

  // Dynamic people sitemap
  let personRoutes: MetadataRoute.Sitemap = [];
  try {
    const people = await getPublishedPeople();
    personRoutes = people.map((p) => ({
      url: `${siteUrl}/personajes/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (e) {
    console.error('Error generating sitemap person routes:', e);
  }

  // Dynamic institutions sitemap
  let institutionRoutes: MetadataRoute.Sitemap = [];
  try {
    const institutions = await getActiveInstitutionsList();
    institutionRoutes = institutions.map((inst) => ({
      url: `${siteUrl}/instituciones/${inst.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }));
  } catch (e) {
    console.error('Error generating sitemap institution routes:', e);
  }

  // Dynamic recognitions sitemap
  let recognitionRoutes: MetadataRoute.Sitemap = [];
  try {
    const recognitions = await getActiveRecognitionsList();
    recognitionRoutes = recognitions.map((r) => ({
      url: `${siteUrl}/reconocimientos/${r.slug}`,
      lastModified: r.recognition_date ? new Date(r.recognition_date) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }));
  } catch (e) {
    console.error('Error generating sitemap recognition routes:', e);
  }

  // Dynamic magazines sitemap
  let magazineRoutes: MetadataRoute.Sitemap = [];
  try {
    const magazines = await getPublishedMagazines();
    magazineRoutes = magazines.map((m) => ({
      url: `${siteUrl}/revista/${m.slug}`,
      lastModified: m.publication_date ? new Date(m.publication_date + 'T00:00:00') : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (e) {
    console.error('Error generating sitemap magazine routes:', e);
  }

  return [
    ...staticRoutes,
    ...contentRoutes,
    ...personRoutes,
    ...institutionRoutes,
    ...recognitionRoutes,
    ...magazineRoutes,
  ];
}
