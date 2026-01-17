import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'dashboard',
		title: 'Dashboard',
		type: 'item',
		icon: 'heroicons-outline:home',
		url: 'example' // Using example as dashboard for now
	},
	{
		id: 'management',
		title: 'Yönetim',
		type: 'group',
		children: [
			{
				id: 'buses',
				title: 'Otobüsler',
				type: 'item',
				icon: 'material-outline:directions_bus',
				url: 'buses'
			},
            {
				id: 'layouts',
				title: 'Koltuk Düzenleri',
				type: 'item',
				icon: 'material-outline:grid_on',
				url: 'layouts'
			},
			{
				id: 'routes',
				title: 'Seferler',
				type: 'item',
				icon: 'material-outline:alt_route',
				url: 'routes'
			},
			{
				id: 'tickets',
				title: 'Biletler',
				type: 'item',
				icon: 'material-outline:confirmation_number',
				url: 'tickets'
			},
            {
				id: 'stations',
				title: 'Durak Yönetimi',
				type: 'item',
				icon: 'material-outline:place',
				url: 'stations'
			}
		]
	}
];

export default navigationConfig;
