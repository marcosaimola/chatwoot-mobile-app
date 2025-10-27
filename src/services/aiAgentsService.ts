import { webhookService } from './WebhookService';

export interface AiAgent {
  nome: string;
  id: number;
  ativo: boolean;
  persona: string;
  picture?: string;
}

export interface UpdateAgentStatusParams {
  id: number;
  ativo: boolean;
}

/**
 * Fetch all AI agents for the account
 */
export async function fetchAiAgents(): Promise<AiAgent[]> {
  try {
    const response = await webhookService.get<AiAgent[]>('agentes/list');
    
    const data = response.data;
    
    // If API returns [{}], return empty array
    if (data.length === 1 && Object.keys(data[0]).length === 0) {
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    throw error;
  }
}

/**
 * Update agent status (activate/deactivate)
 */
export async function updateAgentStatus({ id, ativo }: UpdateAgentStatusParams): Promise<void> {
  try {
    await webhookService.patch('agent/status', { id, status: ativo });
  } catch (error) {
    console.error('Error updating agent status:', error);
    throw error;
  }
}
