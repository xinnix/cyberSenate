import { useState } from 'react';
import { useTable, useCreate, useUpdate, useDelete, useDeleteMany } from '@refinedev/core';
import { List } from '@refinedev/antd';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Card,
  Row,
  Col,
  App,
  Popconfirm,
} from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { CharacterForm } from '../components/CharacterForm';

interface Character {
  id: string;
  name: string;
  slug: string;
  era: string;
  mbti: string;
  coreStance: string;
  speakingStyle: string;
  expertise: string;
  systemPrompt: string;
  avatar?: string;
  isPreset: boolean;
  isActive: boolean;
  sort: number;
}

export const CharacterListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Character | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();
  const { mutate: deleteMany } = useDeleteMany();

  const { tableQuery, currentPage, setCurrentPage, pageSize, setPageSize } = useTable<Character>({
    resource: 'characters',
    pagination: { currentPage: 1, pageSize: 20, mode: 'server' },
    filters: {
      initial: searchText
        ? [{ field: 'search', operator: 'contains', value: searchText } as any]
        : [],
    },
  });

  const result = tableQuery.data;

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isPreset: false, sort: 0 });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Character) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        update(
          {
            resource: 'characters',
            id: editingRecord.id,
            values: { id: editingRecord.id, data: values },
          },
          {
            onSuccess: () => {
              message.success('更新成功');
              setIsModalVisible(false);
              tableQuery.refetch();
            },
            onError: (error: any) => message.error('更新失败: ' + (error.message || '未知错误')),
          },
        );
      } else {
        create(
          { resource: 'characters', values },
          {
            onSuccess: () => {
              message.success('创建成功');
              setIsModalVisible(false);
              tableQuery.refetch();
            },
            onError: (error: any) => message.error('创建失败: ' + (error.message || '未知错误')),
          },
        );
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleDelete = (id: string) => {
    deleteOne(
      { resource: 'characters', id },
      {
        onSuccess: () => {
          message.success('删除成功');
          tableQuery.refetch();
        },
        onError: (error: any) => message.error('删除失败: ' + (error.message || '未知错误')),
      },
    );
  };

  const handleDeleteMany = () => {
    if (selectedRowKeys.length === 0) return;
    deleteMany(
      { resource: 'characters', ids: selectedRowKeys },
      {
        onSuccess: () => {
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          tableQuery.refetch();
        },
        onError: (error: any) => message.error('批量删除失败: ' + (error.message || '未知错误')),
      },
    );
  };

  const columns = [
    {
      title: '角色',
      dataIndex: 'name',
      width: 140,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '标识', dataIndex: 'slug', width: 120, render: (s: string) => <Tag>{s}</Tag> },
    { title: '时代', dataIndex: 'era', width: 100 },
    { title: 'MBTI', dataIndex: 'mbti', width: 80 },
    {
      title: '预制',
      dataIndex: 'isPreset',
      width: 70,
      render: (v: boolean) => (v ? <Tag color="gold">预制</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 70,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', width: 60 },
    {
      title: '操作',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: Character) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <List>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>先哲角色管理</h1>
              <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                管理赛博圆桌的先哲角色定义（7维度）
              </div>
            </Col>
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`确定删除 ${selectedRowKeys.length} 个角色？`}
                    onConfirm={handleDeleteMany}
                  >
                    <Button danger>批量删除</Button>
                  </Popconfirm>
                )}
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新建角色
                </Button>
              </Space>
            </Col>
          </Row>

          <Input
            placeholder="搜索角色名、标识、时代"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, marginBottom: 16 }}
            allowClear
          />

          <Table
            columns={columns}
            rowKey="id"
            dataSource={result?.data || []}
            loading={tableQuery.isLoading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total: result?.total || 0,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />

          <Modal
            title={editingRecord ? '编辑角色' : '新建角色'}
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            okText="确定"
            cancelText="取消"
            width={700}
          >
            <CharacterForm form={form} isEdit={!!editingRecord} />
          </Modal>
        </Card>
      </List>
    </div>
  );
};
