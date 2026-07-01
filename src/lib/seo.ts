export function breadcrumbSchema(site: string, crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${site}${c.path}`,
    })),
  };
}

export function siteUrl(astroSite: URL | undefined): string {
  return (import.meta.env.PUBLIC_SITE_URL || astroSite?.toString() || '').replace(/\/$/, '');
}
