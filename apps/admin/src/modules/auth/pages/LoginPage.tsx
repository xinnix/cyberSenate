import { Form, Input, Button, Card, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/AuthContext';
import { useState } from 'react';
import './LoginPage.css';

export const LoginPage = () => {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    setIsLoading(true);
    try {
      await authLogin(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card-wrapper">
          <Card className="login-card" bordered={false}>
            <div className="login-header">
              <h1>管理系统</h1>
              <p>后台管理系统</p>
            </div>
            <Form form={form} name="login" onFinish={onFinish} autoComplete="off" size="large">
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名或邮箱" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密    码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={isLoading}>
                  登录
                </Button>
              </Form.Item>
            </Form>
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                background: '#f6f8fa',
                borderRadius: 6,
                fontSize: 13,
                color: '#8c8c8c',
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontWeight: 500, color: '#595959', marginBottom: 2 }}>开发测试账号</div>
              <div>
                账号：<code style={{ color: '#1890ff' }}>superadmin@example.com</code>
              </div>
              <div>
                密码：<code style={{ color: '#1890ff' }}>password123</code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
