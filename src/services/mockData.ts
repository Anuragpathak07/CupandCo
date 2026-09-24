import type { MenuCategory, MenuItem, Order, OrderItem, OrderStatus, RealtimeStatus } from '@/types';
import { addedMenuCategories, addedMenuItems } from './menuAdditions';

const categoriesSeed: MenuCategory[] = [
  { id: 'cat-hot-tea', name: 'HOT TEA', sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-hot-choc', name: 'HOT CHOCOLATE', sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-hot-coffee', name: 'HOT COFFEE', sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-cold-coffee', name: 'COLD COFFEE', sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-flav-cold-brews', name: 'FLAVOURED COLD BREWS', sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-iced-latte', name: 'ICED LATTE', sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-fizzie-fest', name: 'FIZZIE FEST', sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-shakes', name: 'SHAKES', sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-coolers', name: 'COOLERS', sortOrder: 8, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-frappe', name: 'FRAPPE', sortOrder: 9, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cat-dessert', name: 'Desserts', sortOrder: 10, createdAt: '2025-01-01T08:00:00.000Z' },
  ...addedMenuCategories,
];

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const minutesFrom = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000).toISOString();

const menuItemsSeed: MenuItem[] = [
  // HOT TEA
  { id: 'item-green-tea', categoryId: 'cat-hot-tea', name: 'Green Tea', description: 'Refreshing anti-oxidant green tea brew', price: 49, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-assam-tea', categoryId: 'cat-hot-tea', name: 'Assam Tea', description: 'Strong and malty black tea from Assam', price: 59, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-chamomile-tea', categoryId: 'cat-hot-tea', name: 'Chamomile Tea', description: 'Soothing floral herbal infusion', price: 69, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-lemon-ginger-honey-tea', categoryId: 'cat-hot-tea', name: 'Lemon Ginger & Honey Tea', description: 'Warming citrus infusion with pure honey', price: 69, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-lemongrass-ginger-green-tea', categoryId: 'cat-hot-tea', name: 'Lemongrass Ginger Green Tea', description: 'Zesty lemongrass & spicy ginger green tea blend', price: 69, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // HOT CHOCOLATE
  { id: 'item-classic-hot-choc', categoryId: 'cat-hot-choc', name: 'Classic Hot Chocolate', description: 'Rich Belgian cocoa steamed with creamy milk', price: 99, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hazelnut-hot-choc', categoryId: 'cat-hot-choc', name: 'Hazelnut Hot Chocolate', description: 'Creamy cocoa infused with roasted hazelnut notes', price: 129, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-brownie-hot-choc', categoryId: 'cat-hot-choc', name: 'Brownie Hot Chocolate', description: 'Indulgent hot cocoa layered with fudge brownie chunks', price: 149, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-tiramisu-hot-choc', categoryId: 'cat-hot-choc', name: 'Tiramisu Hot Chocolate', description: 'Italian tiramisu cocoa with cocoa dust', price: 149, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // HOT COFFEE
  { id: 'item-doppio-espresso', categoryId: 'cat-hot-coffee', name: 'Doppio / Espresso', description: 'Double shot of concentrated single-origin espresso', price: 69, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hot-americano', categoryId: 'cat-hot-coffee', name: 'Hot Americano', description: 'Espresso diluted with hot water for a crisp cup', price: 99, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cappuccino', categoryId: 'cat-hot-coffee', name: 'Cappuccino', description: 'Equal parts espresso, steamed milk, and velvety foam', price: 120, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cafe-latte', categoryId: 'cat-hot-coffee', name: 'Cafe Latte', description: 'Rich espresso with smooth steamed milk', price: 130, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-caramel-latte', categoryId: 'cat-hot-coffee', name: 'Caramel Latte', description: 'Classic espresso latte with buttery caramel drizzle', price: 140, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cafe-mocha', categoryId: 'cat-hot-coffee', name: 'Cafe Mocha', description: 'Espresso combined with cocoa syrup and silky milk', price: 140, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-irish-latte', categoryId: 'cat-hot-coffee', name: 'Irish Latte', description: 'Rich coffee with non-alcoholic Irish cream notes', price: 140, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-spanish-latte', categoryId: 'cat-hot-coffee', name: 'Spanish Latte', description: 'Espresso crafted with sweet condensed milk', price: 150, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // COLD COFFEE
  { id: 'item-cold-coffee', categoryId: 'cat-cold-coffee', name: 'Cold Coffee', description: 'Classic blended iced coffee with milk and ice cream', price: 110, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-blueberry-cold-coffee', categoryId: 'cat-cold-coffee', name: 'Blueberry Cold Coffee', description: 'Signature iced coffee infused with wild blueberry syrup', price: 129, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hazelnut-cold-coffee', categoryId: 'cat-cold-coffee', name: 'Hazelnut Cold Coffee', description: 'Blended cold coffee infused with hazelnut', price: 129, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-tiramisu-cold-coffee', categoryId: 'cat-cold-coffee', name: 'Tiramisu Cold Coffee', description: 'Decadent tiramisu-flavoured chilled coffee shake', price: 149, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-irish-cold-coffee', categoryId: 'cat-cold-coffee', name: 'Irish Cold Coffee', description: 'Premium Irish cream cold coffee indulgence', price: 189, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // FLAVOURED COLD BREWS
  { id: 'item-straight-up-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Straight Up Cold Brew', description: '18-hour slow steep signature cold coffee', price: 110, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-spark-it-up', categoryId: 'cat-flav-cold-brews', name: 'Spark It Up', description: 'Bubbly carbonated signature cold brew boost', price: 119, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-tonic-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Tonic Cold Brew', description: 'Cold brew poured over chilled tonic water', price: 130, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-basil-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Basil Cold Brew', description: 'Herbaceous fresh basil-infused cold brew', price: 149, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-blueberry-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Blueberry Cold Brew', description: 'Cold brew twisted with fruity blueberry notes', price: 149, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hazelnut-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Hazelnut Cold Brew', description: 'Nutty, smooth hazelnut signature cold brew', price: 159, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-peach-iced-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Peach Iced Cold Brew', description: 'Crisp cold brew sweetened with juicy peach nectar', price: 149, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-vietnamese-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Vietnamese Cold Brew', description: 'Bold cold brew layered with sweet condensed milk', price: 169, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cold-brew-ginger-ale', categoryId: 'cat-flav-cold-brews', name: 'Cold Brew Ginger Ale', description: 'Spiced ginger ale infused with signature cold brew', price: 169, isAvailable: true, sortOrder: 8, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-green-apple-cold-brew-ale', categoryId: 'cat-flav-cold-brews', name: 'Green Apple Cold Brew Ale', description: 'Tangy green apple sparkle mixed with cold brew', price: 169, isAvailable: true, sortOrder: 9, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cranberry-cold-brew', categoryId: 'cat-flav-cold-brews', name: 'Cranberry Cold Brew', description: 'Tart cranberry fruit reduction with dark cold brew', price: 169, isAvailable: true, sortOrder: 10, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // ICED LATTE
  { id: 'item-iced-americano', categoryId: 'cat-iced-latte', name: 'Iced Americano', description: 'Double espresso poured over ice and cold water', price: 99, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-classic-iced-latte', categoryId: 'cat-iced-latte', name: 'Classic Iced Latte', description: 'Chilled milk and espresso poured over ice', price: 120, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-iced-mocha', categoryId: 'cat-iced-latte', name: 'Iced Mocha', description: 'Espresso, chocolate syrup, chilled milk and ice', price: 130, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-iced-spanish', categoryId: 'cat-iced-latte', name: 'Iced Spanish', description: 'Chilled espresso latte sweetened with condensed milk', price: 130, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-iced-hazelnut', categoryId: 'cat-iced-latte', name: 'Iced Hazelnut', description: 'Hazelnut flavored iced espresso latte', price: 140, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-iced-tiramisu', categoryId: 'cat-iced-latte', name: 'Iced Tiramisu', description: 'Tiramisu cream topped iced espresso latte', price: 160, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-iced-biscoff', categoryId: 'cat-iced-latte', name: 'Iced Biscoff', description: 'Creamy Biscoff cookie spread iced espresso latte', price: 170, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // FIZZIE FEST
  { id: 'item-berrybull', categoryId: 'cat-fizzie-fest', name: 'Berrybull', description: 'Energy berry infusion over sparkling soda', price: 159, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-espresso-tonic', categoryId: 'cat-fizzie-fest', name: 'Espresso Tonic', description: 'Double shot espresso over sparkling Indian tonic', price: 149, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-ice-coke-espresso', categoryId: 'cat-fizzie-fest', name: 'Ice Coke Espresso', description: 'Refreshing Coca-Cola with a fresh espresso shot', price: 149, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-carbonated-coffee', categoryId: 'cat-fizzie-fest', name: 'Carbonated Coffee', description: 'Sparkling coffee splash with citrus twist', price: 129, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-redbull-espresso', categoryId: 'cat-fizzie-fest', name: 'Redbull Espresso', description: 'Redbull energy drink spiked with double espresso', price: 169, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cranberry-espresso-tonic', categoryId: 'cat-fizzie-fest', name: 'Cranberry Espresso Tonic', description: 'Cranberry juice, tonic water and layered espresso shot', price: 159, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // SHAKES
  { id: 'item-choc-vanilla-shake', categoryId: 'cat-shakes', name: 'Chocolate / Vanilla Shake', description: 'Classic thick shake blended with premium ice cream', price: 99, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-berry-fruit-shake', categoryId: 'cat-shakes', name: 'Strawberry / Blueberry / Mango Shake', description: 'Rich fruit compote milk shake', price: 139, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-oreo-kitkat-shake', categoryId: 'cat-shakes', name: 'Oreo / KitKat Shake', description: 'Crunchy cookie/wafer thick milkshake', price: 99, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cranberry-strawberry-shake', categoryId: 'cat-shakes', name: 'Cranberry Strawberry Shake', description: 'Double berry fruit fusion thick milkshake', price: 109, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hazelnut-shake', categoryId: 'cat-shakes', name: 'Hazelnut Shake', description: 'Roasted hazelnut thick ice cream shake', price: 109, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-nutella-shake', categoryId: 'cat-shakes', name: 'Nutella Shake', description: 'Original Nutella hazelnut chocolate thick shake', price: 109, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-brownie-shake', categoryId: 'cat-shakes', name: 'Brownie Shake', description: 'Decadent chocolate brownie crumbled shake', price: 109, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-ferrero-shake', categoryId: 'cat-shakes', name: 'Ferrero Rocher Shake', description: 'Ferrero chocolate and hazelnut thick shake', price: 109, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // COOLERS
  { id: 'item-mint-mojito', categoryId: 'cat-coolers', name: 'Mint Mojito', description: 'Fresh mint leaves, lime and bubbly soda cooler', price: 99, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-peach-ice-tea', categoryId: 'cat-coolers', name: 'Peach Ice Tea', description: 'Refreshing black tea flavored with sweet peach', price: 99, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-lemon-ice-tea', categoryId: 'cat-coolers', name: 'Lemon Ice Tea', description: 'Classic iced tea infused with fresh lemon squeeze', price: 99, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-ginger-and-lime', categoryId: 'cat-coolers', name: 'Ginger and Lime', description: 'Zesty ginger reduction with fresh lime soda', price: 99, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-green-apple-mojito', categoryId: 'cat-coolers', name: 'Green Apple Mojito', description: 'Crisp green apple syrup with fresh mint & soda', price: 109, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-blueberry-mojito', categoryId: 'cat-coolers', name: 'Blueberry Mojito', description: 'Wild blueberry mint mojito soda cooler', price: 109, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-cranberry-mojito', categoryId: 'cat-coolers', name: 'Cranberry Mojito', description: 'Tart cranberry reduction with mint and sparkling soda', price: 109, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-blue-curacao', categoryId: 'cat-coolers', name: 'Blue Curacao', description: 'Vibrant citrus blue curacao mocktail cooler', price: 109, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // FRAPPE
  { id: 'item-cafe-frappe', categoryId: 'cat-frappe', name: 'Café Frappé', description: 'Blended iced espresso frappe with velvety cream', price: 119, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-oreo-kitkat-frappe', categoryId: 'cat-frappe', name: 'Oreo / Kit-Kat Frappé', description: 'Crushed cookie blended coffee frappé', price: 129, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-mocha-frappe', categoryId: 'cat-frappe', name: 'Mocha Frappé', description: 'Rich chocolate espresso blended frappé', price: 149, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hazelnut-frappe', categoryId: 'cat-frappe', name: 'Hazelnut Frappé', description: 'Hazelnut infused blended iced coffee frappé', price: 149, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-nutella-frappe', categoryId: 'cat-frappe', name: 'Nutella Frappé', description: 'Creamy Nutella whipped coffee frappé', price: 149, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-blueberry-frappe', categoryId: 'cat-frappe', name: 'Blueberry Frappé', description: 'Blueberry berry twist coffee frappé', price: 159, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-irish-coffee-frappe', categoryId: 'cat-frappe', name: 'Irish Coffee Frappé', description: 'Irish cream flavored blended coffee frappé', price: 159, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-tiramisu-frappe', categoryId: 'cat-frappe', name: 'Tiramisu Frappé', description: 'Italian tiramisu cream coffee frappé', price: 179, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },

  // DESSERT
  { id: 'item-gulab-jamun', categoryId: 'cat-dessert', name: 'Gulab Jamun', description: 'Warm milk-solid dumplings soaked in rose cardamom syrup', price: 60, isAvailable: true, sortOrder: 0, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-vanilla-ice-cream', categoryId: 'cat-dessert', name: 'Vanilla Ice Cream', description: 'Scoop of classic vanilla bean ice cream', price: 60, isAvailable: true, sortOrder: 1, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-choco-ice-cream', categoryId: 'cat-dessert', name: 'Chocolate Ice Cream', description: 'Scoop of rich chocolate ice cream', price: 70, isAvailable: true, sortOrder: 2, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-choco-fantasy-sundae', categoryId: 'cat-dessert', name: 'Choco Fantasy Sundae', description: 'Chocolate scoops topped with fudge, nuts and brownie', price: 159, isAvailable: true, sortOrder: 3, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-oreo-mud-sundae', categoryId: 'cat-dessert', name: 'Oreo Mud Sundae', description: 'Crushed Oreo cookies with chocolate ice cream sundae', price: 169, isAvailable: true, sortOrder: 4, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-kitkat-crunch-sundae', categoryId: 'cat-dessert', name: 'Kit Kat Crunch Sundae', description: 'Crispy Kit Kat fingers with vanilla & chocolate ice cream', price: 169, isAvailable: true, sortOrder: 5, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-hot-gulab-jamun-ice-cream', categoryId: 'cat-dessert', name: 'Hot Gulab Jamun & Ice Cream', description: 'Steaming hot Gulab Jamun served with cold vanilla scoop', price: 109, isAvailable: true, sortOrder: 6, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-brownie-overload-sundae', categoryId: 'cat-dessert', name: 'Brownie Overload Sundae', description: 'Triple chocolate brownie layered ice cream sundae', price: 179, isAvailable: true, sortOrder: 7, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-nutella-brownie-sundae', categoryId: 'cat-dessert', name: 'Nutella Brownie Sundae', description: 'Warm brownie drizzled with pure Nutella and ice cream', price: 189, isAvailable: true, sortOrder: 8, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-ice-cream-affogato', categoryId: 'cat-dessert', name: 'Ice Cream Affogato', description: 'Vanilla ice cream scoop drowned in hot espresso', price: 159, isAvailable: true, sortOrder: 9, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-irish-affogato', categoryId: 'cat-dessert', name: 'Irish Affogato', description: 'Affogato enhanced with non-alcoholic Irish cream notes', price: 159, isAvailable: true, sortOrder: 10, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-tiramisu-ice-cream-affogato', categoryId: 'cat-dessert', name: 'Tiramisu Ice Cream Affogato', description: 'Tiramisu ice cream scoop drowned in hot espresso shot', price: 169, isAvailable: true, sortOrder: 11, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  { id: 'item-sizzling-brownie', categoryId: 'cat-dessert', name: 'Sizzling Brownie', description: 'Hot chocolate brownie on a sizzler plate with vanilla scoop', price: 159, isAvailable: true, sortOrder: 12, createdAt: '2025-01-01T08:00:00.000Z', updatedAt: '2025-01-01T08:00:00.000Z' },
  ...addedMenuItems,
];

function makeItem(
  id: string,
  orderId: string,
  menuItemId: string,
  quantity: number,
  notes = '',
): OrderItem {
  const source = menuItemsSeed.find((item) => item.id === menuItemId);
  if (!source) throw new Error(`Unknown mock menu item: ${menuItemId}`);
  return {
    id,
    orderId,
    menuItemId,
    itemName: source.name,
    quantity,
    unitPrice: source.price,
    notes,
  };
}

function makeOrder(
  id: string,
  orderNumber: number,
  status: OrderStatus,
  createdBy: string,
  createdByName: string,
  createdAt: string,
  startedAt: string | null,
  completedAt: string | null,
  notes: string,
  items: OrderItem[],
): Order {
  return {
    id,
    orderNumber,
    status,
    createdBy,
    createdByName,
    createdAt,
    startedAt,
    completedAt,
    notes,
    items: items.map((item) => ({ ...item, orderId: id })),
  };
}

const yesterday = new Date(now - 24 * 60 * 60_000);
const ordersSeed: Order[] = [
  makeOrder('order-1048', 1048, 'COMPLETED', 'demo-cashier', 'Maya Chen', minutesAgo(92), minutesAgo(91), minutesAgo(86), '',
    [makeItem('oi-1048-1', 'order-1048', 'item-cappuccino', 1, 'Extra foam'), makeItem('oi-1048-2', 'order-1048', 'item-sizzling-brownie', 1)]),
  makeOrder('order-1047', 1047, 'COMPLETED', 'demo-cashier', 'Maya Chen', minutesAgo(68), minutesAgo(67), minutesAgo(62), 'For pickup',
    [makeItem('oi-1047-1', 'order-1047', 'item-classic-iced-latte', 2, 'One oat, one whole milk')]),
  makeOrder('order-1046', 1046, 'IN_PROGRESS', 'demo-cashier', 'Maya Chen', minutesAgo(43), minutesAgo(37), null, '',
    [makeItem('oi-1046-1', 'order-1046', 'item-straight-up-cold-brew', 1), makeItem('oi-1046-2', 'order-1046', 'item-oreo-mud-sundae', 2)]),
  makeOrder('order-1045', 1045, 'PENDING', 'demo-cashier', 'Maya Chen', minutesAgo(25), null, null, 'Oat milk, please',
    [makeItem('oi-1045-1', 'order-1045', 'item-cappuccino', 2, 'Oat milk'), makeItem('oi-1045-2', 'order-1045', 'item-blueberry-cold-coffee', 1)]),
  makeOrder('order-1044', 1044, 'PENDING', 'demo-cashier', 'Maya Chen', minutesAgo(11), null, null, '',
    [makeItem('oi-1044-1', 'order-1044', 'item-iced-spanish', 1)]),
  makeOrder('order-1043', 1043, 'COMPLETED', 'demo-cashier', 'Noah Patel', minutesFrom(yesterday, 9 * 60 + 12), minutesFrom(yesterday, 9 * 60 + 13), minutesFrom(yesterday, 9 * 60 + 18), 'Dine in',
    [makeItem('oi-1043-1', 'order-1043', 'item-nutella-brownie-sundae', 1), makeItem('oi-1043-2', 'order-1043', 'item-green-tea', 1)]),
  makeOrder('order-1042', 1042, 'CANCELLED', 'demo-cashier', 'Noah Patel', minutesFrom(yesterday, 8 * 60 + 40), null, null, 'Guest changed their mind',
    [makeItem('oi-1042-1', 'order-1042', 'item-classic-hot-choc', 1)]),
];

let categories = clone(categoriesSeed);
let menuItems = clone(menuItemsSeed);
let orders = clone(ordersSeed);
let nextOrderNumber = 1049;

const listeners = new Set<() => void>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 90 + Math.round(Math.random() * 90)));
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeMockChanges(onChange: () => void, onStatus?: (status: RealtimeStatus) => void) {
  const listener = () => onChange();
  listeners.add(listener);
  onStatus?.('connecting');
  const timer = setTimeout(() => onStatus?.('live'), 180);
  return () => {
    clearTimeout(timer);
    listeners.delete(listener);
    onStatus?.('offline');
  };
}

export async function getMockMenu() {
  await delay();
  return {
    categories: clone(categories).sort((a, b) => a.sortOrder - b.sortOrder),
    items: clone(menuItems).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getMockOrders() {
  await delay();
  return clone(orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMockOrder(input: {
  notes: string;
  createdBy: string | null;
  items: { menuItemId: string; itemName: string; quantity: number; unitPrice: number; notes: string }[];
}) {
  await delay();
  const id = createId('order');
  const createdAt = new Date().toISOString();
  const order: Order = {
    id,
    orderNumber: nextOrderNumber++,
    status: 'PENDING',
    notes: input.notes.trim(),
    createdBy: input.createdBy,
    createdByName: input.createdBy === 'demo-cashier' ? 'Maya Chen' : 'Guest checkout',
    createdAt,
    startedAt: null,
    completedAt: null,
    items: input.items.map((item, index) => ({
      id: `${id}-item-${index + 1}`,
      orderId: id,
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes.trim(),
    })),
  };
  orders = [order, ...orders];
  emitChange();
  return clone(order);
}

export async function updateMockOrderStatus(id: string, status: OrderStatus) {
  await delay();
  const timestamp = new Date().toISOString();
  let found = false;
  orders = orders.map((order) => {
    if (order.id !== id) return order;
    found = true;
    return {
      ...order,
      status,
      startedAt: status === 'IN_PROGRESS' ? order.startedAt ?? timestamp : order.startedAt,
      completedAt: status === 'COMPLETED' ? timestamp : status === 'CANCELLED' ? null : order.completedAt,
    };
  });
  if (!found) throw new Error('Order not found.');
  emitChange();
  return clone(orders.find((order) => order.id === id) as Order);
}

export async function createMockCategory(name: string) {
  await delay();
  const category: MenuCategory = {
    id: createId('category'),
    name: name.trim(),
    sortOrder: categories.length,
    createdAt: new Date().toISOString(),
  };
  categories = [...categories, category];
  emitChange();
  return clone(category);
}

export async function updateMockCategory(id: string, name: string) {
  await delay();
  if (!categories.some((category) => category.id === id)) throw new Error('Category not found.');
  categories = categories.map((category) => (category.id === id ? { ...category, name: name.trim() } : category));
  emitChange();
  return clone(categories.find((category) => category.id === id) as MenuCategory);
}

export async function deleteMockCategory(id: string) {
  await delay();
  if (menuItems.some((item) => item.categoryId === id)) {
    throw new Error('Move or delete this category’s menu items first.');
  }
  categories = categories.filter((category) => category.id !== id);
  emitChange();
}

export async function reorderMockCategories(orderedIds: string[]) {
  await delay();
  const positions = new Map(orderedIds.map((id, index) => [id, index]));
  categories = categories
    .map((category) => ({ ...category, sortOrder: positions.get(category.id) ?? category.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  emitChange();
  return clone(categories);
}

export async function createMockMenuItem(input: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) {
  await delay();
  const timestamp = new Date().toISOString();
  const item: MenuItem = {
    ...input,
    id: createId('menu-item'),
    name: input.name.trim(),
    description: input.description.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  menuItems = [...menuItems, item];
  emitChange();
  return clone(item);
}

export async function updateMockMenuItem(id: string, input: Partial<Omit<MenuItem, 'id' | 'createdAt'>>) {
  await delay();
  if (!menuItems.some((item) => item.id === id)) throw new Error('Menu item not found.');
  menuItems = menuItems.map((item) =>
    item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
  );
  emitChange();
  return clone(menuItems.find((item) => item.id === id) as MenuItem);
}

export async function deleteMockMenuItem(id: string) {
  await delay();
  menuItems = menuItems.filter((item) => item.id !== id);
  emitChange();
}

export function resetMockData() {
  categories = clone(categoriesSeed);
  menuItems = clone(menuItemsSeed);
  orders = clone(ordersSeed);
  nextOrderNumber = 1049;
  emitChange();
}
