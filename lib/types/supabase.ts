import { SupabaseClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          domain: string
          plan: number
          timezone: string
          country: string
          city: string
          address: string
          postal_code: number
          additional_invoice_information: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string
          plan?: number
          timezone?: string
          country?: string
          city?: string
          address?: string
          postal_code?: number
          additional_invoice_information?: string
        }
        Update: {
          id: string
          name?: string
          domain?: string
          plan?: number
          timezone?: string
          country?: string
          city?: string
          address?: string
          postal_code?: number
          additional_invoice_information?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          company_id: string
          updated_at: string | null
          full_name: string
          username: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          email: string | null
          type: number | null
          status: number | null
          role: number | null
          is_superuser: number | null
          credits: number | null
          selected_provider_id: string | null
        }
        Insert: {
          id?: string
          company_id: string
          updated_at?: string | null
          full_name: string
          username: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          email?: string | null
          type?: number | null
          status?: number | null
          role?: number | null
          is_superuser?: number | null
          credits: number | null
          selected_provider_id?: string | null
        }
        Update: {
          id: string
          company_id: string
          updated_at?: string | null
          full_name: string
          username: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          email?: string | null
          type?: number | null
          status?: number | null
          role?: number | null
          is_superuser?: number | null
          credits: number | null
          selected_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          user_id: string
          service: number
          service_id: string | null
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          user_id: string
          service: number
          service_id: string | null
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          user_id: string
          service: number
          service_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'customers_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'customers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      purchases: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          customer_id: string
          expires_at: string | null
          plan: number
          purchase_id: string | null
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          customer_id: string
          expires_at: string | null
          plan: number
          purchase_id: string | null
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          customer_id: string
          expires_at: string | null
          plan: number
          purchase_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      chats: {
        Row: {
          company_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chats_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chats_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      chat_documents: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_documents_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chat_documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          chat_id: string
          content: Json
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          company_id: string
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          role: string
          updated_at?: string
        }
        Update: {
          company_id: string
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey'
            columns: ['chat_id']
            isOneToOne: false
            referencedRelation: 'chats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_chat_id_fkey'
            columns: ['chat_id']
            isOneToOne: false
            referencedRelation: 'chats'
            referencedColumns: ['id']
          },
        ]
      }
      providers: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          user_id: string
          type: number
          status: number
          account_id: string
          private_identifier: string
          public_identifier: string
          first_name: string
          last_name: string
          email: string
          like_target_private_identifiers: string[]
          like_target_hours: number[]
          check_reaction_hours: number[]
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          user_id: string
          type: number
          status: number
          account_id: string
          private_identifier: string
          public_identifier: string
          first_name: string
          last_name: string
          email: string
          like_target_private_identifiers?: string[]
          like_target_hours?: number[]
          check_reaction_hours?: number[]
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          user_id: string
          type: number
          status: number
          account_id: string
          private_identifier: string
          public_identifier: string
          first_name: string
          email: string
          last_name: string
          like_target_private_identifiers: string[]
          like_target_hours: number[]
          check_reaction_hours: number[]
        }
        Relationships: [
          {
            foreignKeyName: 'providers_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'provider_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      provider_daily_insights: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          provider_id: string
          follower_count: number
          connections_count: number
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          follower_count: number
          connections_count: number
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          follower_count: number
          connections_count: number
        }
        Relationships: [
          {
            foreignKeyName: 'provider_daily_insights_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'provider_daily_insights_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }

      workflows: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          provider_id: string
          type: number
          name: string
          status: number
          scheduled_hours: number[]
          scheduled_days: number[]
          scheduled_months: number[]
          scheduled_weekdays: number[]
          search_url: string
          target_workflow_id: string
          keywords: string
          company_private_identifiers: string[]
          network_distance: number[]
          search_reaction_profile_public_identifier: string
          invitation_message: string
          invitation_sent_at: string
          first_message: string
          first_message_days: number
          first_message_sent_at: string
          second_message: string
          second_message_days: number
          second_message_sent_at: string
          third_message: string
          third_message_days: number
          third_message_sent_at: string
          limit_count: number
          max_execution_minutes: number
          max_number_of_launches: number
          email_notify_manual_launch_error: boolean
          email_notify_auto_launch_error: boolean
          email_notify_manual_error: boolean
          email_notify_auto_error: boolean
          email_notify_manual_time_limit: boolean
          email_notify_auto_time_limit: boolean
          email_notify_manual_success: boolean
          email_notify_auto_success: boolean
          slack_webhook_url: string
          last_updated_user_id: string
          run_limit_count: number
          agent_type: number
          invitation_message_dify_api_key: string
          first_message_dify_api_key: string
          first_message_trigger_type: number
          second_message_dify_api_key: string
          second_message_trigger_type: number
          third_message_dify_api_key: string
          third_message_trigger_type: number
          job_position: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          type: number
          name: string
          status?: number
          scheduled_hours?: number[]
          scheduled_days?: number[]
          scheduled_months?: number[]
          scheduled_weekdays?: number[]
          search_url?: string
          keywords?: string
          company_private_identifiers?: string[]
          target_workflow_id?: string
          network_distance?: number[]
          search_reaction_profile_public_identifier?: string
          invitation_message?: string
          invitation_sent_at?: string
          first_message?: string
          first_message_days?: number
          first_message_sent_at?: string
          second_message?: string
          second_message_days?: number
          second_message_sent_at?: string
          third_message?: string
          third_message_days?: number
          third_message_sent_at?: string
          limit_count: number
          max_execution_minutes?: number
          max_number_of_launches?: number
          email_notify_manual_launch_error?: boolean
          email_notify_auto_launch_error?: boolean
          email_notify_manual_error?: boolean
          email_notify_auto_error?: boolean
          email_notify_manual_time_limit?: boolean
          email_notify_auto_time_limit?: boolean
          email_notify_manual_success?: boolean
          email_notify_auto_success?: boolean
          slack_webhook_url?: string
          last_updated_user_id: string
          run_limit_count?: number
          agent_type?: number
          invitation_message_dify_api_key?: string
          first_message_dify_api_key?: string
          first_message_trigger_type?: number
          second_message_dify_api_key?: string
          second_message_trigger_type?: number
          third_message_dify_api_key?: string
          third_message_trigger_type?: number
          job_position?: string
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          type?: number
          name: string
          // TODO:
          status?: number
          scheduled_hours: number[]
          scheduled_days: number[]
          scheduled_months: number[]
          scheduled_weekdays: number[]
          search_url?: string
          keywords?: string
          company_private_identifiers?: string[]
          target_workflow_id?: string
          network_distance?: number[]
          search_reaction_profile_public_identifier?: string
          invitation_message?: string
          invitation_sent_at?: string
          first_message?: string
          first_message_days?: number
          first_message_sent_at?: string
          second_message?: string
          second_message_days?: number
          second_message_sent_at?: string
          third_message?: string
          third_message_days?: number
          third_message_sent_at?: string
          limit_count: number
          max_execution_minutes?: number
          max_number_of_launches?: number
          email_notify_manual_launch_error?: boolean
          email_notify_auto_launch_error?: boolean
          email_notify_manual_error?: boolean
          email_notify_auto_error?: boolean
          email_notify_manual_time_limit?: boolean
          email_notify_auto_time_limit?: boolean
          email_notify_manual_success?: boolean
          email_notify_auto_success?: boolean
          slack_webhook_url?: string
          run_limit_count?: number
          last_updated_user_id: string
          agent_type?: number
          invitation_message_dify_api_key?: string
          first_message_dify_api_key?: string
          first_message_trigger_type?: number
          second_message_dify_api_key?: string
          second_message_trigger_type?: number
          third_message_dify_api_key?: string
          third_message_trigger_type?: number
          job_position?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workflows_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workflows_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'providers'
            referencedColumns: ['id']
          },
        ]
      }
      workflow_histories: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          workflow_id: string
          status: number
          cursor: string
          error_message: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          workflow_id: string
          status: number
          cursor?: string
          error_message?: string
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          workflow_id: string
          status: number
          cursor?: string
          error_message?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workflow_histories_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workflow_histories_workflow_id_fkey'
            columns: ['workflow_id']
            isOneToOne: false
            referencedRelation: 'workflows'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          provider_id: string
          private_identifier: string
          public_identifier?: string
          profile_picture_url: string
          full_name: string
          first_name: string
          last_name: string
          headline: string
          summary: string
          emails: string[]
          phones: string[]
          addresses: string[]
          socials: string[]
          birth_month: string
          birth_day: string
          primary_locale_country: string
          primary_locale_language: string
          location: string
          websites: string[]
          can_send_inmail: boolean
          is_influencer: boolean
          is_creator: boolean
          is_hiring: boolean
          is_open_to_work: boolean
          network_distance: number
          connections_count: number
          follower_count: number
          shared_connections_count: number
          keywords: string
          thread: string
          invitation_message: string
          generated_invitation_message: string
          invitation_sent_at: string
          invitation_replied_at: string
          first_message: string
          generated_first_message: string
          first_message_sent_at: string
          first_message_read_at: string
          first_message_replied_at: string
          second_message: string
          generated_second_message: string
          second_message_sent_at: string
          second_message_read_at: string
          second_message_replied_at: string
          third_message: string
          generated_third_message: string
          third_message_sent_at: string
          third_message_read_at: string
          third_message_replied_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          private_identifier?: string
          public_identifier?: string
          profile_picture_url?: string
          full_name?: string
          first_name?: string
          last_name?: string
          headline?: string
          summary?: string
          emails?: string[]
          phones?: string[]
          addresses?: string[]
          socials?: string[]
          birth_month?: string
          birth_day?: string
          primary_locale_country?: string
          primary_locale_language?: string
          location?: string
          websites?: string[]
          can_send_inmail?: boolean
          is_influencer?: boolean
          is_creator?: boolean
          is_hiring?: boolean
          is_open_to_work?: boolean
          network_distance?: number
          connections_count?: number
          follower_count?: number
          shared_connections_count?: number
          keywords?: string
          thread?: string
          invitation_message?: string
          generated_invitation_message?: string
          invitation_sent_at?: string
          invitation_replied_at?: string
          first_message?: string
          generated_first_message?: string
          first_message_sent_at?: string
          first_message_read_at?: string
          first_message_replied_at?: string
          second_message?: string
          generated_second_message?: string
          second_message_sent_at?: string
          second_message_read_at?: string
          second_message_replied_at?: string
          third_message?: string
          generated_third_message?: string
          third_message_sent_at?: string
          third_message_read_at?: string
          third_message_replied_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          provider_id: string
          private_identifier?: string
          public_identifier?: string
          profile_picture_url?: string
          full_name?: string
          first_name?: string
          last_name?: string
          headline?: string
          summary?: string
          emails?: string[]
          phones?: string[]
          addresses?: string[]
          socials?: string[]
          birth_month?: string
          birth_day?: string
          primary_locale_country?: string
          primary_locale_language?: string
          location?: string
          websites?: string[]
          can_send_inmail?: boolean
          is_influencer?: boolean
          is_creator?: boolean
          is_hiring?: boolean
          is_open_to_work?: boolean
          network_distance: number
          connections_count?: number
          follower_count?: number
          shared_connections_count?: number
          keywords?: string
          thread?: string
          invitation_message?: string
          generated_invitation_message?: string
          invitation_sent_at?: string
          invitation_replied_at?: string
          first_message?: string
          generated_first_message?: string
          first_message_sent_at?: string
          first_message_read_at?: string
          first_message_replied_at?: string
          second_message?: string
          generated_second_message?: string
          second_message_sent_at?: string
          second_message_read_at?: string
          second_message_replied_at?: string
          third_message?: string
          generated_third_message?: string
          third_message_sent_at?: string
          third_message_read_at?: string
          third_message_replied_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_workflow_id_fkey'
            columns: ['workflow_id']
            isOneToOne: false
            referencedRelation: 'workflows'
            referencedColumns: ['id']
          },
        ]
      }
      lead_workflows: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          workflow_id: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          workflow_id: string
        }
        Update: {
          id: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_workflows_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_workflows_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_workflows_workflow_id_fkey'
            columns: ['workflow_id']
            isOneToOne: false
            referencedRelation: 'workflows'
            referencedColumns: ['id']
          },
        ]
      }
      lead_statuses: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          workflow_id: string
          status: number
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          workflow_id: string
          status: number
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          workflow_id?: string
          status: number
        }
        Relationships: [
          {
            foreignKeyName: 'lead_statuses_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_statuses_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      lead_work_experiences: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          position: string
          company: string
          location: string
          description: string
          skills: string[]
          current: boolean
          status: string
          start_date: Date
          end_date: Date
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          position: string
          company: string
          location: string
          description?: string
          skills?: string[]
          current?: boolean
          status?: string
          start_date?: Date
          end_date?: Date
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          position?: string
          company?: string
          location?: string
          description?: string
          skills?: string[]
          current?: boolean
          status?: string
          start_date?: Date
          end_date?: Date
        }
        Relationships: [
          {
            foreignKeyName: 'lead_work_experiences_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_work_experiences_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_volunteering_experiences: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          company: string
          description: string
          role: string
          cause: string
          start_date: Date
          end_date: Date
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          company: string
          description?: string
          role: string
          cause: string
          start_date?: Date
          end_date?: Date
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          company?: string
          description?: string
          role?: string
          cause?: string
          start_date?: Date
          end_date?: Date
        }
        Relationships: [
          {
            foreignKeyName: 'lead_volunteering_experiences_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_volunteering_experiences_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_educations: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          degree: string
          school: string
          field_of_study: string
          start_date: Date
          end_date: Date
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          degree: string
          school: string
          field_of_study: string
          start_date?: Date
          end_date?: Date
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          degree?: string
          school?: string
          field_of_study?: string
          start_date?: Date
          end_date?: Date
        }
        Relationships: [
          {
            foreignKeyName: 'lead_educations_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_educations_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_skills: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          name: string
          endorsement_count: number
          endorsement_id: number
          insights: string[]
          endorsed: boolean
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          name: string
          endorsement_count?: number
          endorsement_id?: number
          insights?: string[]
          endorsed?: boolean
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          name?: string
          endorsement_count?: number
          endorsement_id?: number
          insights?: string[]
          endorsed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'lead_skills_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_skills_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_languages: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          name: string
          proficiency: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          name: string
          proficiency: string
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          name?: string
          proficiency?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_languages_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_languages_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_certifications: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          name: string
          organization: string
          url: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          name: string
          organization: string
          url: string
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          name?: string
          organization?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_certifications_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_certifications_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }

      lead_projects: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          name: string
          description: string
          skills: string[]
          start_date: Date
          end_date: Date
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          name: string
          description?: string
          skills?: string[]
          start_date?: Date
          end_date?: Date
        }
        Update: {
          id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id?: string
          name?: string
          description?: string
          skills?: string[]
          start_date?: Date
          end_date?: Date
        }
        Relationships: [
          {
            foreignKeyName: 'lead_projects_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_projects_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      lead_reactions: {
        Row: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          reacted_at: string
          reaction_type: number
          post_url: string
          post_private_identifier: string
          private_identifier: string
          content: string
        }
        Insert: {
          id?: string
          company_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
          lead_id: string
          reacted_at: string
          reaction_type: number
          post_url: string
          post_private_identifier: string
          private_identifier: string
          content: string
        }
        Update: {
          id: string
          company_id: string
          created_at: string
          updated_at: string
          deleted_at: string
          lead_id: string
          reacted_at: string
          reaction_type: number
          post_url: string
          post_private_identifier: string
          private_identifier: string
          content: string
        }
        Relationships: [
          {
            foreignKeyName: 'lead_reactions_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_reactions_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_document_latest_version: {
        Args: {
          doc_id: string
        }
        Returns: string
      }
      get_latest_document: {
        Args: {
          doc_id: string
          auth_user_id: string
        }
        Returns: {
          id: string
          user_id: string
          title: string
          content: string
          created_at: string
        }[]
      }
      get_next_file_version: {
        Args: {
          p_bucket_id: string
          p_storage_path: string
        }
        Returns: number
      }
      gtrgm_compress: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          '': unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          '': unknown
        }
        Returns: unknown
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: Json
          similarity: number
        }[]
      }
      replace_api_routes: {
        Args: {
          frontend_code: string
        }
        Returns: string
      }
      set_limit: {
        Args: {
          '': number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          '': string
        }
        Returns: string[]
      }
      vector_avg: {
        Args: {
          '': number[]
        }
        Returns: string
      }
      vector_dims: {
        Args: {
          '': string
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          '': string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          '': string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          '': string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          '': unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]
export type PublicSchemaTables = PublicSchema['Tables']

// Add Document type
export type Document = PublicSchemaTables['chat_documents']['Row']
export type Chat = PublicSchemaTables['chats']['Row']
export type Profile = PublicSchemaTables['profiles']['Row']
export type Provider = PublicSchemaTables['providers']['Row']

export type ProviderWithChild = PublicSchemaTables['providers']['Row'] & {
  provider_daily_insights?: PublicSchemaTables['provider_daily_insights']['Row'][]
}

export type Workflow = PublicSchemaTables['workflows']['Row'] & {
  workflow_histories: WorkflowHistory[]
}

export type WorkflowHistory = PublicSchemaTables['workflow_histories']['Row']

export type LeadInsert = PublicSchemaTables['leads']['Insert'] & {
  lead_workflows?: PublicSchemaTables['lead_workflows']['Insert'][] | undefined
  lead_statuses?: PublicSchemaTables['lead_statuses']['Insert'][] | undefined
  lead_work_experiences?:
    | PublicSchemaTables['lead_work_experiences']['Insert'][]
    | undefined
  lead_volunteering_experiences?:
    | PublicSchemaTables['lead_volunteering_experiences']['Insert'][]
    | undefined
  lead_educations?:
    | PublicSchemaTables['lead_educations']['Insert'][]
    | undefined
  lead_skills?: PublicSchemaTables['lead_skills']['Insert'][] | undefined
  lead_languages?: PublicSchemaTables['lead_languages']['Insert'][] | undefined
  lead_certifications?:
    | PublicSchemaTables['lead_certifications']['Insert'][]
    | undefined
  lead_projects?: PublicSchemaTables['lead_projects']['Insert'][] | undefined
  lead_reactions?: PublicSchemaTables['lead_reactions']['Insert'][] | undefined
}

export type Lead = PublicSchemaTables['leads']['Row'] & {
  lead_workflows: PublicSchemaTables['lead_workflows']['Row'][]
  lead_statuses: PublicSchemaTables['lead_statuses']['Row'][]
  lead_work_experiences: PublicSchemaTables['lead_work_experiences']['Row'][]
  lead_volunteering_experiences: PublicSchemaTables['lead_volunteering_experiences']['Row'][]
  lead_educations: PublicSchemaTables['lead_educations']['Row'][]
  lead_skills: PublicSchemaTables['lead_skills']['Row'][]
  lead_languages: PublicSchemaTables['lead_languages']['Row'][]
  lead_certifications: PublicSchemaTables['lead_certifications']['Row'][]
  lead_projects: PublicSchemaTables['lead_projects']['Row'][]
  lead_reactions: PublicSchemaTables['lead_reactions']['Row'][]

  status?: number
  workflow_id?: string
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchemaTables & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchemaTables &
        PublicSchema['Views'])
    ? (PublicSchemaTables &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchemaTables
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchemaTables
    ? PublicSchemaTables[PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchemaTables
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchemaTables
    ? PublicSchemaTables[PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export type Client = SupabaseClient<Database>

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

// Add types for tool invocations and annotations
export interface ToolInvocation {
  state: 'call' | 'result'
  toolCallId: string
  toolName: string
  args?: any
  result?: any
}

export interface MessageAnnotation {
  messageIdFromServer?: string
}

// Update Message interface to match AI library format
export interface Message {
  id?: string
  chat_id: string
  role: MessageRole
  content: string | Record<string, unknown>
  created_at: string
  toolInvocations?: ToolInvocation[]
  annotations?: MessageAnnotation[]
}

export interface PostgrestError {
  code: string
  message: string
  details: string | null
  hint: string | null
}

export function handleDatabaseError(error: PostgrestError | null) {
  if (!error) return null

  console.error('Database error:', error)

  switch (error.code) {
    case '23505': // Unique violation
      if (error.message.includes('messages_pkey')) {
        throw new Error('Message ID already exists')
      }
      if (error.message.includes('chats_pkey')) {
        throw new Error('Chat ID already exists')
      }
      throw new Error('Unique constraint violation')
    case '23503': // Foreign key violation
      throw new Error('Referenced record does not exist')
    case '42501': // RLS violation
      throw new Error('Unauthorized access')
    case 'PGRST116': // Not found
      return null
    case 'PGRST204': // Column not found
      throw new Error('Invalid column name')
    default:
      throw error
  }
}

// Add DatabaseMessage type to match the database schema
export interface DatabaseMessage {
  id?: string
  chat_id: string
  role: string
  content: string // Always stored as string in database
  created_at: string
}

// Helper function to convert between formats
export function convertToDBMessage(message: Message): DatabaseMessage {
  let content = message.content

  // Convert content to string if it's an object
  if (typeof content === 'object') {
    const messageData: any = { content }

    // Add tool invocations if present
    if (message.toolInvocations?.length) {
      messageData.toolInvocations = message.toolInvocations
    }

    // Add annotations if present
    if (message.annotations?.length) {
      messageData.annotations = message.annotations
    }

    content = JSON.stringify(messageData)
  }

  return {
    chat_id: message.chat_id,
    role: message.role,
    content: content as string,
    created_at: message.created_at,
  }
}

// Helper function to parse database message
export function parseDBMessage(dbMessage: DatabaseMessage): Message {
  try {
    const content = JSON.parse(dbMessage.content)

    // Check if content is a message data object
    if (content && typeof content === 'object' && 'content' in content) {
      return {
        ...dbMessage,
        content: content.content,
        toolInvocations: content.toolInvocations,
        annotations: content.annotations,
        role: dbMessage.role as MessageRole,
      }
    }

    // If not a special format, return as is
    return {
      ...dbMessage,
      content: dbMessage.content,
      role: dbMessage.role as MessageRole,
    }
  } catch {
    // If not valid JSON, return as plain text
    return {
      ...dbMessage,
      content: dbMessage.content,
      role: dbMessage.role as MessageRole,
    }
  }
}

// Add these types to your existing types file

export interface FileUpload {
  id: string
  created_at: string
  chat_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  public_url: string
}

export interface StorageError {
  message: string
  statusCode: string
}
