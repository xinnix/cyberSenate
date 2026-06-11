import { Form, Input, Select, Switch, InputNumber } from 'antd';

interface CharacterFormProps {
  form: any;
  isEdit?: boolean;
}

export const CharacterForm = ({ form, isEdit = false }: CharacterFormProps) => {
  return (
    <Form form={form} layout="vertical">
      <Form.Item name="name" label="角色名" rules={[{ required: true, message: '请输入角色名' }]}>
        <Input placeholder="例如：🏛️ 加图" />
      </Form.Item>

      <Form.Item name="slug" label="标识" rules={[{ required: true, message: '请输入标识' }]}>
        <Input placeholder="例如：cato" disabled={isEdit} />
      </Form.Item>

      <Form.Item name="era" label="时代/背景" rules={[{ required: true, message: '请输入时代' }]}>
        <Input placeholder="例如：古罗马" />
      </Form.Item>

      <Form.Item name="mbti" label="MBTI" rules={[{ required: true, message: '请输入MBTI' }]}>
        <Select
          placeholder="选择 MBTI"
          options={[
            'INTJ',
            'INTP',
            'ENTJ',
            'ENTP',
            'INFJ',
            'INFP',
            'ENFJ',
            'ENFP',
            'ISTJ',
            'ISTP',
            'ESTJ',
            'ESTP',
            'ISFJ',
            'ISFP',
            'ESFJ',
            'ESFP',
          ].map((t) => ({ label: t, value: t }))}
        />
      </Form.Item>

      <Form.Item
        name="coreStance"
        label="核心立场"
        rules={[{ required: true, message: '请输入核心立场' }]}
      >
        <Input.TextArea placeholder="一句话世界观" rows={2} />
      </Form.Item>

      <Form.Item
        name="speakingStyle"
        label="说话风格"
        rules={[{ required: true, message: '请输入说话风格' }]}
      >
        <Input.TextArea placeholder="语气、修辞、句式特点" rows={2} />
      </Form.Item>

      <Form.Item
        name="expertise"
        label="知识领域"
        rules={[{ required: true, message: '请输入知识领域' }]}
      >
        <Input placeholder="例如：风险、道德、传统vs创新" />
      </Form.Item>

      <Form.Item
        name="systemPrompt"
        label="系统提示词"
        rules={[{ required: true, message: '请输入系统提示词' }]}
      >
        <Input.TextArea placeholder="完整的角色 prompt" rows={4} />
      </Form.Item>

      <Form.Item name="avatar" label="头像 URL">
        <Input placeholder="头像图片地址（可选）" />
      </Form.Item>

      <Form.Item name="sort" label="排序">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="isPreset" label="预制角色" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="isActive" label="启用" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );
};
