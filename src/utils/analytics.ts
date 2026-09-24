import type { AnalyticsData, Order } from '@/types';
import { isSameLocalDay } from './dates';
import { getOrderSubtotal } from './orders';

export function calculateAnalytics(orders: Order[], date = new Date()): AnalyticsData {
  const todaysOrders = orders.filter((order) => isSameLocalDay(order.createdAt, date));
  const completed = todaysOrders.filter((order) => order.status === 'COMPLETED');
  const revenue = completed.reduce((total, order) => total + getOrderSubtotal(order), 0);
  const prepTimes = completed
    .filter((order) => order.startedAt && order.completedAt)
    .map((order) =>
      Math.max(
        0,
        (new Date(order.completedAt as string).getTime() - new Date(order.startedAt as string).getTime()) / 1000,
      ),
    );
  const popular = new Map<string, { menuItemId: string | null; name: string; quantity: number; revenue: number }>();

  completed.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.menuItemId ?? `name:${item.itemName}`;
      const current = popular.get(key) ?? {
        menuItemId: item.menuItemId,
        name: item.itemName,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.quantity * item.unitPrice;
      popular.set(key, current);
    });
  });

  return {
    revenue,
    orderCount: completed.length,
    averageOrderValue: completed.length ? revenue / completed.length : 0,
    averagePrepSeconds: prepTimes.length
      ? prepTimes.reduce((total, seconds) => total + seconds, 0) / prepTimes.length
      : 0,
    statusCounts: {
      completed: completed.length,
      pending: todaysOrders.filter((order) => order.status === 'PENDING').length,
      inProgress: todaysOrders.filter((order) => order.status === 'IN_PROGRESS').length,
      cancelled: todaysOrders.filter((order) => order.status === 'CANCELLED').length,
    },
    popularItems: [...popular.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue),
  };
}
