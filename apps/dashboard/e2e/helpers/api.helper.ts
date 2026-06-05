import axios from 'axios';

export class ApiHelper {
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = process.env.E2E_API_URL || 'http://localhost:3003/v1';
    this.secret = process.env.E2E_TEST_SECRET || 'e2e_s3cr3t_k3y_d0_n0t_us3_in_pr0d';
  }

  private getHeaders() {
    return {
      'x-e2e-secret': this.secret,
      'Content-Type': 'application/json',
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/e2e/health`, {
        headers: this.getHeaders(),
      });
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  async getOtp(mobile: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/e2e/otp/${mobile}`, {
        headers: this.getHeaders(),
      });
      if (response.data && response.data.otp) {
        return String(response.data.otp);
      }
      throw new Error(`OTP not found for mobile ${mobile}`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch OTP from backend: ${errMsg}`);
    }
  }

  async setPassword(mobile: string, password?: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/e2e/set-password`,
        { mobile, password },
        { headers: this.getHeaders() }
      );
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed to set password: ${errMsg}`);
    }
  }

  async deleteUser(mobile: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${this.baseUrl}/e2e/user/${mobile}`, {
        headers: this.getHeaders(),
      });
      return !!response.data?.deleted;
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      console.warn(`Failed to delete user ${mobile}: ${errMsg}`);
      return false;
    }
  }
}

export const apiHelper = new ApiHelper();
