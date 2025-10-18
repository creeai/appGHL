import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface EvolutionMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface EvolutionContactResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class EvolutionApiService {
  private config: EvolutionApiConfig;
  private axiosInstance: AxiosInstance;

  constructor(config: EvolutionApiConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });

    // Interceptor para logs
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Logs de requisição simplificados
        console.log(`[Evolution API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Evolution API] Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Logs de resposta simplificados
        console.log(`[Evolution API] Resposta: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[Evolution API] Erro na resposta:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Envia mensagem de texto via WhatsApp
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<EvolutionMessageResponse> {
    try {
      console.log(`📤 === EVOLUTION API SENDTEXT ===`);
      console.log(`📞 Telefone original:`, phoneNumber);
      console.log(`🔧 Instância:`, this.config.instanceName);
      console.log(`🌐 URL base:`, this.axiosInstance.defaults.baseURL);
      console.log(`🔑 API Key:`, this.config.apiKey ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
      console.log(`⏰ Timestamp:`, new Date().toISOString());
      console.log(`📤 === FIM CONFIGURAÇÃO ===`);
      
      // Remove o + e adiciona @s.whatsapp.net
      const formattedPhone = phoneNumber.replace('+', '') + '@s.whatsapp.net';
      console.log(`📞 Telefone formatado:`, formattedPhone);
      
      const payload = {
        number: formattedPhone,
        text: message
      };
      console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));
      
      const url = `/message/sendText/${this.config.instanceName}`;
      console.log(`🌐 URL completa:`, `${this.axiosInstance.defaults.baseURL}${url}`);
      
      console.log(`📤 === FAZENDO REQUISIÇÃO PARA EVOLUTION API ===`);
      console.log(`📤 URL: ${url}`);
      console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
      console.log(`📤 Headers:`, JSON.stringify(this.axiosInstance.defaults.headers, null, 2));
      console.log(`📤 === INICIANDO REQUISIÇÃO ===`);
      
      const response: AxiosResponse = await this.axiosInstance.post(url, payload);
      
      console.log(`📤 === RESPOSTA EVOLUTION API ===`);
      console.log(`📤 Status: ${response.status}`);
      console.log(`📤 Headers:`, JSON.stringify(response.headers, null, 2));
      console.log(`📤 Data:`, JSON.stringify(response.data, null, 2));
      console.log(`📤 === FIM RESPOSTA ===`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error(`❌ === ERRO EVOLUTION API ===`);
      console.error(`❌ Status:`, error.response?.status);
      console.error(`❌ Status Text:`, error.response?.statusText);
      console.error(`❌ Headers:`, error.response?.headers);
      console.error(`❌ Data:`, JSON.stringify(error.response?.data, null, 2));
      console.error(`❌ Message:`, error.message);
      console.error(`❌ === FIM ERRO ===`);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia mensagem de mídia via WhatsApp
   */
  async sendMediaMessage(phoneNumber: string, mediaUrl: string, caption?: string): Promise<EvolutionMessageResponse> {
    try {
      const formattedPhone = phoneNumber.replace('+', '') + '@s.whatsapp.net';
      
      const payload: any = {
        number: formattedPhone,
        mediaMessage: {
          mediatype: 'image',
          media: mediaUrl
        }
      };

      if (caption) {
        payload.mediaMessage.caption = caption;
      }

      const response: AxiosResponse = await this.axiosInstance.post(
        `/message/sendMedia/${this.config.instanceName}`,
        payload
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Erro ao enviar mídia via Evolution API:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica se uma instância está conectada
   */
  async checkInstanceStatus(): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.axiosInstance.get(
        `/instance/connectionState/${this.config.instanceName}`
      );
      
      // Logs de status simplificados
      console.log('Status da instância:', response.data.state);
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
      
      // Se não tem state, mas a resposta existe, considera válida
      if (!response.data.state && response.data) {
        console.log('✅ Instância existe mas sem state definido - considerando válida');
        return true;
      }
      
      // Aceita diferentes status que indicam que a instância está funcionando
      const validStates = ['open', 'connecting', 'connected', 'ready', 'authenticated'];
      const isValidState = validStates.includes(response.data.state);
      
      console.log(`Status '${response.data.state}' é válido: ${isValidState}`);
      
      return isValidState;
    } catch (error: any) {
      console.error('Erro ao verificar status da instância:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Busca informações de um contato
   */
  async getContactInfo(phoneNumber: string): Promise<EvolutionContactResponse> {
    try {
      const formattedPhone = phoneNumber.replace('+', '') + '@s.whatsapp.net';
      
      const response: AxiosResponse = await this.axiosInstance.get(
        `/chat/findContact/${this.config.instanceName}`,
        {
          params: { number: formattedPhone }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Erro ao buscar informações do contato:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Busca histórico de mensagens de um chat
   */
  async getChatHistory(phoneNumber: string, limit: number = 50): Promise<EvolutionMessageResponse> {
    try {
      const formattedPhone = phoneNumber.replace('+', '') + '@s.whatsapp.net';
      
      const response: AxiosResponse = await this.axiosInstance.get(
        `/chat/findMessages/${this.config.instanceName}`,
        {
          params: { 
            number: formattedPhone,
            limit: limit
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Erro ao buscar histórico do chat:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(phoneNumber: string): Promise<EvolutionMessageResponse> {
    try {
      const formattedPhone = phoneNumber.replace('+', '') + '@s.whatsapp.net';
      
      const response: AxiosResponse = await this.axiosInstance.put(
        `/chat/readMessages/${this.config.instanceName}`,
        {
          number: formattedPhone
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Cria uma nova instância
   */
  async createInstance(): Promise<EvolutionMessageResponse> {
    try {
      console.log(`🔧 === VERIFICANDO INSTÂNCIA EVOLUTION ===`);
      console.log(`🔧 Nome da instância: ${this.config.instanceName}`);
      
      // Primeiro verifica se a instância já existe
      const statusResponse = await this.axiosInstance.get(
        `/instance/connectionState/${this.config.instanceName}`
      );

      console.log(`🔍 Status da instância:`, JSON.stringify(statusResponse.data, null, 2));

      if (statusResponse.data && statusResponse.data.state) {
        console.log(`✅ Instância ${this.config.instanceName} já existe com status: ${statusResponse.data.state}`);
        return {
          success: true,
          data: { message: 'Instância já existe', state: statusResponse.data.state }
        };
      }

      // Se não existe, cria nova instância
      console.log(`🔧 === CRIANDO NOVA INSTÂNCIA ===`);
      const response: AxiosResponse = await this.axiosInstance.post(
        `/instance/create`,
        {
          instanceName: this.config.instanceName,
          token: this.config.apiKey,
          qrcode: true,
          number: '',
          webhook: process.env.EVOLUTION_WEBHOOK_URL || '',
          webhookByEvents: false,
          webhookBase64: false
        }
      );

      console.log(`✅ Instância criada com sucesso:`, JSON.stringify(response.data, null, 2));
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error(`❌ === ERRO AO CRIAR INSTÂNCIA ===`);
      console.error(`❌ Status:`, error.response?.status);
      console.error(`❌ Mensagem:`, error.response?.data?.message);
      console.error(`❌ Dados:`, JSON.stringify(error.response?.data, null, 2));

      // Se o erro é que a instância já existe, considera sucesso
      if (error.response?.status === 403) {
        console.log(`✅ Instância ${this.config.instanceName} já existe (erro 403) - considerando sucesso`);
        return {
          success: true,
          data: { message: 'Instância já existe', state: 'existing' }
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Remove uma instância
   */
  async deleteInstance(): Promise<EvolutionMessageResponse> {
    try {
      const response: AxiosResponse = await this.axiosInstance.delete(
        `/instance/delete/${this.config.instanceName}`
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro desconhecido'
      };
    }
  }
}
