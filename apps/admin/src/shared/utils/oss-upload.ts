/**
 * OSS 直传上传工具
 *
 * 支持两种上传方式：
 * 1. OSS 直传：使用阿里云 OSS Post Policy 签名方式实现前端直传
 * 2. 服务端上传：本地存储时回退到 REST API 服务端上传
 */

import { trpcClient } from '../dataProvider/dataProvider';

export interface UploadCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  bucket: string;
  region: string;
  endpoint: string;
  policy: string;
  signature: string;
  xOssSignatureVersion: string;
  xOssCredential: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export type UploadType =
  | 'merchant_logo'
  | 'news_banner'
  | 'merchant_gallery'
  | 'news_content'
  | 'avatar';

/**
 * OSS 直传上传类
 */
export class OSSUploader {
  /**
   * 上传文件
   *
   * 优先尝试 OSS 直传，若后端为本地存储则自动回退到服务端上传。
   */
  static async upload(file: File, type: UploadType): Promise<UploadResult> {
    try {
      return await this.uploadToOSS(file, type);
    } catch {
      // OSS 凭证获取失败（本地存储等场景），回退到服务端上传
      return await this.uploadViaServer(file, type);
    }
  }

  /**
   * OSS 直传上传
   * 凭证为 null 表示后端为本地存储，直接跳过以避免不必要的 500 错误。
   */
  private static async uploadToOSS(file: File, type: UploadType): Promise<UploadResult> {
    // 1. 获取上传凭证
    const credentials = await trpcClient.upload.getUploadCredentials.query({ type });

    // 本地存储等不支持直传的场景，credentials 为 null
    if (!credentials) {
      throw new Error('STORAGE_NOT_SUPPORT_DIRECT_UPLOAD');
    }

    // 2. 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const fileName = `${timestamp}-${randomStr}${ext}`;
    const key = `images/${type}/${fileName}`;

    // 3. 构建 FormData
    const formData = new FormData();
    formData.append('key', key);
    formData.append('policy', credentials.policy);
    formData.append('OSSAccessKeyId', credentials.accessKeyId);
    formData.append('signature', credentials.signature);
    formData.append('success_action_status', '200');
    if (credentials.securityToken) {
      formData.append('x-oss-security-token', credentials.securityToken);
    }
    formData.append('file', file);

    // 4. 发送 POST 请求到 OSS
    const response = await fetch(credentials.endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    // 5. 构建文件 URL
    const url = `${credentials.endpoint}/${key}`;

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  /**
   * 服务端上传（通过 tRPC，本地存储等场景使用）
   */
  private static async uploadViaServer(file: File, type: UploadType): Promise<UploadResult> {
    // 将文件转为 base64 data URI
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const result = await trpcClient.upload.uploadFile.mutate({
      file: dataUri,
      fileName: file.name,
      type,
    });

    if (!result?.url) {
      throw new Error('上传失败：未返回文件 URL');
    }

    return {
      url: result.url,
      fileName: result.fileName || file.name,
      fileSize: result.fileSize || file.size,
    };
  }

  /**
   * 批量上传文件
   *
   * @param files 文件列表
   * @param type 上传类型
   * @returns 上传结果列表
   */
  static async uploadMultiple(files: File[], type: UploadType): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.upload(file, type)));
  }

  /**
   * 验证文件类型
   *
   * @param file 文件
   * @param allowedTypes 允许的 MIME 类型
   * @returns 是否合法
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件大小
   *
   * @param file 文件
   * @param maxSize 最大大小（字节）
   * @returns 是否合法
   */
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }
}
