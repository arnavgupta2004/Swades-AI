// Type definitions for agent types (since SQLite doesn't support enums)
export type AgentType = 'ROUTER' | 'SUPPORT' | 'ORDER' | 'BILLING';
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
