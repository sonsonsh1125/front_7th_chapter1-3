import { Notifications, Repeat } from '@mui/icons-material';
import { Box, Stack, Typography, Tooltip } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';

import { Event } from '../types';

const meta: Meta = {
  title: 'Event States/Visual Representation',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const getRepeatTypeLabel = (type: string): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

// 스타일 상수 (App.tsx와 동일)
const eventBoxStyles = {
  notified: {
    backgroundColor: '#ffebee',
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  normal: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'normal',
    color: 'inherit',
  },
  common: {
    p: 0.5,
    my: 0.5,
    borderRadius: 1,
    minHeight: '18px',
    width: '100%',
    overflow: 'hidden',
  },
};

// Event Box 컴포넌트
const EventBox = ({
  event,
  isNotified = false,
  isDragging = false,
}: {
  event: Event;
  isNotified?: boolean;
  isDragging?: boolean;
}) => {
  const isRepeating = event.repeat.type !== 'none';

  return (
    <Box
      sx={{
        ...eventBoxStyles.common,
        ...(isNotified ? eventBoxStyles.notified : eventBoxStyles.normal),
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (
          <Tooltip
            title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
            }`}
          >
            <Repeat fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
};

// Mock 이벤트 데이터
const normalEvent: Event = {
  id: '1',
  title: '일반 회의',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  description: '일반적인 회의',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 0,
};

const notifiedEvent: Event = {
  id: '2',
  title: '중요한 회의',
  date: '2024-01-15',
  startTime: '14:00',
  endTime: '15:00',
  description: '알림이 있는 회의',
  location: '회의실 B',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const repeatingEvent: Event = {
  id: '3',
  title: '매일 반복 회의',
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '10:00',
  description: '데일리 스탠드업',
  location: '온라인',
  category: '업무',
  repeat: { type: 'daily', interval: 1, endDate: '2024-12-31' },
  notificationTime: 0,
};

const notifiedAndRepeatingEvent: Event = {
  id: '4',
  title: '중요한 반복 회의',
  date: '2024-01-15',
  startTime: '16:00',
  endTime: '17:00',
  description: '알림이 있고 반복되는 회의',
  location: '회의실 C',
  category: '업무',
  repeat: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
  notificationTime: 60,
};

const longTitleEvent: Event = {
  id: '5',
  title: '매우 긴 제목을 가진 일정입니다. 이 일정은 텍스트 오버플로우 처리를 테스트하기 위한 것입니다.',
  date: '2024-01-15',
  startTime: '11:00',
  endTime: '12:00',
  description: '긴 제목 테스트',
  location: '회의실 D',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 0,
};

const longTitleNotifiedEvent: Event = {
  id: '6',
  title: '매우 긴 제목을 가진 알림 일정입니다. 이 일정은 텍스트 오버플로우와 알림 상태를 함께 테스트합니다.',
  date: '2024-01-15',
  startTime: '13:00',
  endTime: '14:00',
  description: '긴 제목 + 알림 테스트',
  location: '회의실 E',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const weeklyRepeatingEvent: Event = {
  id: '7',
  title: '주간 회의',
  date: '2024-01-15',
  startTime: '15:00',
  endTime: '16:00',
  description: '주간 리뷰',
  location: '회의실 F',
  category: '업무',
  repeat: { type: 'weekly', interval: 1 },
  notificationTime: 0,
};

const monthlyRepeatingEvent: Event = {
  id: '8',
  title: '월간 회의',
  date: '2024-01-15',
  startTime: '17:00',
  endTime: '18:00',
  description: '월간 리뷰',
  location: '회의실 G',
  category: '업무',
  repeat: { type: 'monthly', interval: 1, endDate: '2024-12-31' },
  notificationTime: 0,
};

const yearlyRepeatingEvent: Event = {
  id: '9',
  title: '연간 회의',
  date: '2024-01-15',
  startTime: '18:00',
  endTime: '19:00',
  description: '연간 리뷰',
  location: '회의실 H',
  category: '업무',
  repeat: { type: 'yearly', interval: 1 },
  notificationTime: 0,
};

// 스토리들
export const NormalEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        일반 일정
      </Typography>
      <EventBox event={normalEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        회색 배경 (#f5f5f5), 일반 글씨, 기본 색상
      </Typography>
    </Box>
  ),
};

export const NotifiedEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        알림이 있는 일정
      </Typography>
      <EventBox event={notifiedEvent} isNotified={true} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        빨간색 배경 (#ffebee), 굵은 글씨, 빨간색 텍스트 (#d32f2f), 알림 아이콘 표시
      </Typography>
    </Box>
  ),
};

export const RepeatingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        반복 일정 (매일)
      </Typography>
      <EventBox event={repeatingEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Repeat 아이콘 표시, 반복 유형 툴팁 제공
      </Typography>
    </Box>
  ),
};

export const NotifiedAndRepeatingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        알림 + 반복 일정
      </Typography>
      <EventBox event={notifiedAndRepeatingEvent} isNotified={true} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        알림 아이콘과 Repeat 아이콘 모두 표시, 빨간색 스타일 적용
      </Typography>
    </Box>
  ),
};

export const DraggingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        드래그 중인 일정
      </Typography>
      <EventBox event={normalEvent} isDragging={true} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        투명도 0.5로 표시
      </Typography>
    </Box>
  ),
};

export const LongTitleEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        긴 제목 일정
      </Typography>
      <EventBox event={longTitleEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        텍스트 오버플로우 처리 (noWrap), 말줄임표 표시
      </Typography>
    </Box>
  ),
};

export const LongTitleNotifiedEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        긴 제목 + 알림 일정
      </Typography>
      <EventBox event={longTitleNotifiedEvent} isNotified={true} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        긴 제목과 알림 상태가 함께 적용된 경우
      </Typography>
    </Box>
  ),
};

export const WeeklyRepeatingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        주간 반복 일정
      </Typography>
      <EventBox event={weeklyRepeatingEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        주간 반복 아이콘 표시
      </Typography>
    </Box>
  ),
};

export const MonthlyRepeatingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        월간 반복 일정
      </Typography>
      <EventBox event={monthlyRepeatingEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        월간 반복 아이콘 표시, 종료일 포함
      </Typography>
    </Box>
  ),
};

export const YearlyRepeatingEvent: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        연간 반복 일정
      </Typography>
      <EventBox event={yearlyRepeatingEvent} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        연간 반복 아이콘 표시
      </Typography>
    </Box>
  ),
};

export const AllStatesComparison: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '800px' }}>
      <Typography variant="h5">일정 상태별 시각적 표현 비교</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            일반 일정
          </Typography>
          <EventBox event={normalEvent} />
        </Box>
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            알림 일정
          </Typography>
          <EventBox event={notifiedEvent} isNotified={true} />
        </Box>
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            반복 일정
          </Typography>
          <EventBox event={repeatingEvent} />
        </Box>
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            알림 + 반복
          </Typography>
          <EventBox event={notifiedAndRepeatingEvent} isNotified={true} />
        </Box>
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            드래그 중
          </Typography>
          <EventBox event={normalEvent} isDragging={true} />
        </Box>
        <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            긴 제목
          </Typography>
          <EventBox event={longTitleEvent} />
        </Box>
      </Stack>
    </Stack>
  ),
};

export const MultipleEventsInCell: Story = {
  render: () => (
    <Box sx={{ width: '300px', p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        같은 날짜의 여러 일정
      </Typography>
      <Stack spacing={0.5}>
        <EventBox event={normalEvent} />
        <EventBox event={notifiedEvent} isNotified={true} />
        <EventBox event={repeatingEvent} />
        <EventBox event={notifiedAndRepeatingEvent} isNotified={true} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        여러 상태의 일정이 같은 셀에 표시되는 경우
      </Typography>
    </Box>
  ),
};

