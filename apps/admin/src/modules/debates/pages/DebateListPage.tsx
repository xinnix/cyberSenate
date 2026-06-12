import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Space, App, Tooltip, Select, Input } from 'antd';
import {
  SoundOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { trpcClient } from '../../../shared/dataProvider/dataProvider';

interface DebateCharacter {
  character: { id: string; name: string; avatar: string | null };
  role: string;
}

interface DebateUser {
  id: string;
  nickname: string | null;
  email: string | null;
}

interface Debate {
  id: string;
  topic: string;
  type: string;
  status: string;
  audioStatus: string | null;
  mergedAudioUrl: string | null;
  createdAt: string;
  characters: DebateCharacter[];
  user: DebateUser | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待开始', color: 'default' },
  GENERATING: { label: '生成中', color: 'processing' },
  CONCLUDED: { label: '已完成', color: 'success' },
  FAILED: { label: '失败', color: 'error' },
};

const AUDIO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待生成', color: 'default' },
  generating: { label: '生成中', color: 'processing' },
  ready: { label: '已就绪', color: 'success' },
  failed: { label: '失败', color: 'error' },
};

const ROLE_LABEL: Record<string, string> = {
  attacker: '攻',
  defender: '守',
  deconstructor: '解',
};

interface DebateListPageProps {
  debateType: 'COURT' | 'CONSULTATION';
  title: string;
}

export function DebateListPage({ debateType, title }: DebateListPageProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const queryKey = ['debates', debateType, page, pageSize, status, search];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      (trpcClient as any).debates.getMany.query({
        page,
        pageSize,
        type: debateType,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  /** 触发随机圆桌 */
  const handleTriggerCourt = useCallback(async () => {
    setTriggering(true);
    try {
      const res = await (trpcClient as any).debates.triggerCourt.mutate();
      message.success(`已触发：${res.topic}`);
      // 等 2 秒后刷新列表，让后台有时间开始生成
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['debates', debateType] });
      }, 2000);
    } catch (err: any) {
      message.error(err.message || '触发失败');
    } finally {
      setTriggering(false);
    }
  }, [debateType, message, queryClient]);

  /** 触发音频生成 */
  const handleGenerateAudio = async (debateId: string) => {
    setGeneratingId(debateId);
    try {
      const res = await (trpcClient as any).debates.generateAudio.mutate({ id: debateId });
      message.success(res.message || '音频生成已触发');
      setTimeout(() => refetch(), 3000);
    } catch (err: any) {
      message.error(err.message || '触发失败');
    } finally {
      setGeneratingId(null);
    }
  };

  /** 下载合并音频 */
  const handleDownloadAudio = async (debateId: string, topic: string) => {
    try {
      const res = await (trpcClient as any).debates.downloadAudio.query({ id: debateId });
      if (res?.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename || `论衡-${topic.substring(0, 20)}.mp3`;
        a.target = '_blank';
        a.click();
      }
    } catch (err: any) {
      message.error(err.message || '下载失败');
    }
  };

  const baseColumns = [
    {
      title: '主题',
      dataIndex: 'topic',
      key: 'topic',
      ellipsis: true,
      width: 260,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '角色',
      key: 'characters',
      width: 200,
      render: (_: unknown, record: Debate) => (
        <Space size={4}>
          {record.characters?.map((dc, i) => (
            <Tooltip key={i} title={`${dc.character.name} — ${dc.role}`}>
              <Tag color="geekblue" style={{ margin: 0 }}>
                {ROLE_LABEL[dc.role] || '?'} {dc.character.name}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: '辩论状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '音频状态',
      dataIndex: 'audioStatus',
      key: 'audioStatus',
      width: 100,
      render: (status: string | null) => {
        if (!status) return <Tag>—</Tag>;
        const info = AUDIO_STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '—'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: Debate) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SoundOutlined />}
            loading={generatingId === record.id}
            disabled={record.status !== 'CONCLUDED'}
            onClick={() => handleGenerateAudio(record.id)}
          >
            转语音
          </Button>
          {record.mergedAudioUrl && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadAudio(record.id, record.topic)}
            >
              下载
            </Button>
          )}
          <Tooltip title="刷新状态">
            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 自定义圆桌：额外显示所属用户列
  const columns =
    debateType === 'CONSULTATION'
      ? [
          ...baseColumns.slice(0, 2), // 主题 + 角色
          {
            title: '所属用户',
            key: 'user',
            width: 140,
            render: (_: unknown, record: Debate) =>
              record.user ? (
                <span>{record.user.nickname || record.user.email || '—'}</span>
              ) : (
                <Tag>—</Tag>
              ),
          },
          ...baseColumns.slice(2), // 状态 + 音频 + 时间 + 操作
        ]
      : baseColumns;

  return (
    <Card
      title={title}
      styles={{ body: { padding: 0 } }}
      extra={
        debateType === 'COURT' ? (
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={triggering}
            onClick={handleTriggerCourt}
          >
            触发随机圆桌
          </Button>
        ) : undefined
      }
    >
      <div style={{ padding: '16px 24px', display: 'flex', gap: 12 }}>
        <Input.Search
          placeholder="搜索主题"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="辩论状态"
          allowClear
          style={{ width: 140 }}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { label: '待开始', value: 'PENDING' },
            { label: '生成中', value: 'GENERATING' },
            { label: '已完成', value: 'CONCLUDED' },
            { label: '失败', value: 'FAILED' },
          ]}
        />
      </div>
      <Table
        rowKey="id"
        dataSource={data?.items || []}
        columns={columns}
        loading={isLoading}
        scroll={{ x: debateType === 'CONSULTATION' ? 1230 : 1090 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </Card>
  );
}
