import { createClient } from '@supabase/supabase-js'

// Using direct URLs for faster initialization and error prevention
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eeqpvvkxttsqyfunsibb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcXB2dmt4dHRzcXlmdW5zaWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQ0MjQsImV4cCI6MjA2NjM2MDQyNH0.3W25cdLQSgeQv4ekrZmAitia1aIjJQSorrcAAUVWJiI'

// Create Supabase client with better retries
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
  global: { fetch: fetch.bind(globalThis) }
})

// AI Chat Service
export const aiChatService = {
  async sendMessage(message: string, sessionType: 'morning' | 'evening', conversationHistory: any[], userName?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message,
          sessionType,
          conversationHistory,
          userName: userName || undefined,
        },
      })

      if (error) throw error
      if (data?.error) {
        throw new Error(data.details || data.error)
      }
      return data
    } catch (error) {
      console.error('AI Chat Error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get AI response'
      )
    }
  },

  async generateInsightCard(sessionMessages: any[], sessionType: 'morning' | 'evening') {
    try {
      const { data, error } = await supabase.functions.invoke('generate-insight', {
        body: {
          sessionMessages,
          sessionType,
        },
      })

      if (error) throw error
      return data

    } catch (error) {
      console.error('Insight Generation Error:', error)
      throw new Error('Failed to generate insight card')
    }
  },
}

// Subscription Service
export const subscriptionService = {
  async checkSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'check-subscription',
        { body: { userId } }
      )

      return error ? { isPro: false, status: 'inactive' } : data
    } catch (error) {
      console.error('Subscription Check Error:', error)
      return { isPro: false, status: 'inactive' }
    }
  },

  async createSubscription(userId: string, planId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { userId, planId },
      })

      if (error) throw error
      return data
    } 
    catch (error) {
      console.error('Subscription Creation Error:', error)
      throw new Error('Failed to create subscription')
    }
  },
}