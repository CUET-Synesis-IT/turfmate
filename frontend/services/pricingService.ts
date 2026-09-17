import apiClient from '@/lib/api';

export interface PricingRule {
    id: string;
    court_id: string;
    name: string;
    day_of_week?: number | null; // 0=Mon, 4=Fri, 6=Sun, null=every day
    start_time: string;
    end_time: string;
    price_per_hour: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PricingRuleCreatePayload {
    name: string;
    day_of_week?: number | null;
    start_time: string;
    end_time: string;
    price_per_hour: number;
    is_active?: boolean;
}

export const pricingService = {
    async getCourtPricingRules(courtId: string): Promise<PricingRule[]> {
        const res = await apiClient.get<PricingRule[]>(`/api/v1/courts/${courtId}/pricing-rules`);
        return res.data;
    },

    async createCourtPricingRule(courtId: string, payload: PricingRuleCreatePayload): Promise<PricingRule> {
        const res = await apiClient.post<PricingRule>(`/api/v1/courts/${courtId}/pricing-rules`, payload);
        return res.data;
    },

    async deletePricingRule(ruleId: string): Promise<{ message: string }> {
        const res = await apiClient.delete<{ message: string }>(`/api/v1/pricing-rules/${ruleId}`);
        return res.data;
    },
};
