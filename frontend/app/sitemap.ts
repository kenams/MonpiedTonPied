import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const routes = [
        '',
        '/browse',
        '/creators',
        '/offers',
        '/create',
        '/auth/login',
        '/auth/register',
        '/profile',
        '/legal/cgu',
        '/legal/cgv',
        '/legal/privacy',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
    }));
}
