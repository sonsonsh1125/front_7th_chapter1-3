import { Close } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import RecurringEventDialog from './RecurringEventDialog';
import { Event } from '../types';

const meta: Meta = {
  title: 'Dialogs & Modals/All Dialogs',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockEvent: Event = {
  id: '1',
  title: '회의',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  description: '팀 회의',
  location: '회의실 A',
  category: '업무',
  repeat: {
    type: 'daily',
    interval: 1,
    endDate: '2024-12-31',
  },
  notificationTime: 10,
};

// Overlap Dialog 컴포넌트
const OverlapDialog = ({
  open,
  onClose,
  onConfirm,
  overlappingEvents,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overlappingEvents: Event[];
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>일정 겹침 경고</DialogTitle>
    <DialogContent>
      <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
      {overlappingEvents.map((event) => (
        <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
          {event.title} ({event.date} {event.startTime}-{event.endTime})
        </Typography>
      ))}
      <DialogContentText>계속 진행하시겠습니까?</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>취소</Button>
      <Button color="error" onClick={onConfirm}>
        계속 진행
      </Button>
    </DialogActions>
  </Dialog>
);

// Notification Alert 컴포넌트
const NotificationAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <Alert
    severity="info"
    sx={{ width: 'auto', minWidth: '300px' }}
    action={
      <IconButton size="small" onClick={onClose}>
        <Close />
      </IconButton>
    }
  >
    <AlertTitle>{message}</AlertTitle>
  </Alert>
);

// RecurringEventDialog 스토리들
export const RecurringEventDialogEdit: Story = {
  render: () => (
    <RecurringEventDialog
      open={true}
      mode="edit"
      event={mockEvent}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const RecurringEventDialogDelete: Story = {
  render: () => (
    <RecurringEventDialog
      open={true}
      mode="delete"
      event={mockEvent}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const RecurringEventDialogMove: Story = {
  render: () => (
    <RecurringEventDialog
      open={true}
      mode="move"
      event={mockEvent}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const RecurringEventDialogClosed: Story = {
  render: () => (
    <RecurringEventDialog
      open={false}
      mode="edit"
      event={mockEvent}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

// OverlapDialog 스토리들
export const OverlapDialogSingle: Story = {
  render: () => (
    <OverlapDialog
      open={true}
      overlappingEvents={[
        {
          id: '1',
          title: '기존 회의',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '팀 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const OverlapDialogMultiple: Story = {
  render: () => (
    <OverlapDialog
      open={true}
      overlappingEvents={[
        {
          id: '1',
          title: '기존 회의',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '팀 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '다른 일정',
          date: '2024-01-15',
          startTime: '10:30',
          endTime: '11:30',
          description: '중요한 미팅',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 60,
        },
        {
          id: '3',
          title: '세 번째 일정',
          date: '2024-01-15',
          startTime: '10:45',
          endTime: '11:45',
          description: '추가 미팅',
          location: '회의실 C',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 120,
        },
      ]}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const OverlapDialogManyEvents: Story = {
  render: () => (
    <OverlapDialog
      open={true}
      overlappingEvents={Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        title: `겹치는 일정 ${i + 1}`,
        date: '2024-01-15',
        startTime: `${9 + i}:00`,
        endTime: `${10 + i}:00`,
        description: `설명 ${i + 1}`,
        location: `위치 ${i + 1}`,
        category: ['업무', '개인', '가족', '기타'][i % 4],
        repeat: { type: 'none' as const, interval: 0 },
        notificationTime: [1, 10, 60, 120][i % 4],
      }))}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

export const OverlapDialogClosed: Story = {
  render: () => (
    <OverlapDialog
      open={false}
      overlappingEvents={[
        {
          id: '1',
          title: '기존 회의',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '팀 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ]}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
};

// Notification Alert 스토리들
export const NotificationAlertSingle: Story = {
  render: () => <NotificationAlert message="10분 후 '회의' 일정이 시작됩니다." onClose={fn()} />,
};

export const NotificationAlertMultiple: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: '400px' }}>
      <NotificationAlert message="10분 후 '회의' 일정이 시작됩니다." onClose={fn()} />
      <NotificationAlert message="1시간 후 '점심 약속' 일정이 시작됩니다." onClose={fn()} />
      <NotificationAlert message="2시간 후 '팀 미팅' 일정이 시작됩니다." onClose={fn()} />
    </Stack>
  ),
};

export const NotificationAlertLongMessage: Story = {
  render: () => (
    <NotificationAlert
      message="매우 긴 알림 메시지입니다. 이 알림은 긴 텍스트가 어떻게 표시되는지 테스트하기 위한 것입니다. 텍스트가 길어도 레이아웃이 깨지지 않아야 합니다."
      onClose={fn()}
    />
  ),
};

// Dialog 크기 및 레이아웃 테스트
export const DialogSizes: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '800px' }}>
      <Typography variant="h6">다이얼로그 크기 비교</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            Small (기본)
          </Typography>
          <Dialog open={true} maxWidth="xs" fullWidth>
            <DialogTitle>작은 다이얼로그</DialogTitle>
            <DialogContent>
              <DialogContentText>이 다이얼로그는 작은 크기입니다.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={fn()}>취소</Button>
              <Button onClick={fn()}>확인</Button>
            </DialogActions>
          </Dialog>
        </Box>
        <Box>
          <Typography variant="caption" display="block" gutterBottom>
            Medium (RecurringEventDialog)
          </Typography>
          <RecurringEventDialog
            open={true}
            mode="edit"
            event={mockEvent}
            onClose={fn()}
            onConfirm={fn()}
          />
        </Box>
      </Stack>
    </Stack>
  ),
};

// 모든 다이얼로그 비교
export const AllDialogsComparison: Story = {
  render: () => (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '1200px' }}>
      <Typography variant="h5">모든 다이얼로그 및 모달 비교</Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            RecurringEventDialog
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <RecurringEventDialog
              open={true}
              mode="edit"
              event={mockEvent}
              onClose={fn()}
              onConfirm={fn()}
            />
            <RecurringEventDialog
              open={true}
              mode="delete"
              event={mockEvent}
              onClose={fn()}
              onConfirm={fn()}
            />
            <RecurringEventDialog
              open={true}
              mode="move"
              event={mockEvent}
              onClose={fn()}
              onConfirm={fn()}
            />
          </Stack>
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            OverlapDialog
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <OverlapDialog
              open={true}
              overlappingEvents={[
                {
                  id: '1',
                  title: '기존 회의',
                  date: '2024-01-15',
                  startTime: '10:00',
                  endTime: '11:00',
                  description: '팀 회의',
                  location: '회의실 A',
                  category: '업무',
                  repeat: { type: 'none', interval: 0 },
                  notificationTime: 10,
                },
              ]}
              onClose={fn()}
              onConfirm={fn()}
            />
            <OverlapDialog
              open={true}
              overlappingEvents={[
                {
                  id: '1',
                  title: '기존 회의',
                  date: '2024-01-15',
                  startTime: '10:00',
                  endTime: '11:00',
                  description: '팀 회의',
                  location: '회의실 A',
                  category: '업무',
                  repeat: { type: 'none', interval: 0 },
                  notificationTime: 10,
                },
                {
                  id: '2',
                  title: '다른 일정',
                  date: '2024-01-15',
                  startTime: '10:30',
                  endTime: '11:30',
                  description: '중요한 미팅',
                  location: '회의실 B',
                  category: '업무',
                  repeat: { type: 'none', interval: 0 },
                  notificationTime: 60,
                },
              ]}
              onClose={fn()}
              onConfirm={fn()}
            />
          </Stack>
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Notification Alerts
          </Typography>
          <Stack spacing={2}>
            <NotificationAlert message="10분 후 '회의' 일정이 시작됩니다." onClose={fn()} />
            <NotificationAlert message="1시간 후 '점심 약속' 일정이 시작됩니다." onClose={fn()} />
          </Stack>
        </Box>
      </Stack>
    </Stack>
  ),
};

// 버튼 상태 테스트
export const DialogButtonStates: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '800px' }}>
      <Typography variant="h6">다이얼로그 버튼 상태</Typography>
      <Dialog open={true} maxWidth="sm" fullWidth>
        <DialogTitle>버튼 상태 테스트</DialogTitle>
        <DialogContent>
          <DialogContentText>다양한 버튼 스타일과 상태를 확인합니다.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={fn()} color="inherit">
            취소 (inherit)
          </Button>
          <Button onClick={fn()} variant="outlined" color="primary">
            아니오 (outlined)
          </Button>
          <Button onClick={fn()} variant="contained" color="primary">
            예 (contained)
          </Button>
          <Button onClick={fn()} color="error" variant="contained">
            계속 진행 (error)
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  ),
};

// 긴 내용이 있는 다이얼로그
export const DialogWithLongContent: Story = {
  render: () => (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>긴 내용이 있는 다이얼로그</DialogTitle>
      <DialogContent>
        <DialogContentText>
          이 다이얼로그는 매우 긴 내용을 포함하고 있습니다. 스크롤이 필요한 경우를 테스트하기 위한
          것입니다. 여러 줄의 텍스트가 포함되어 있으며, 다이얼로그의 레이아웃이 올바르게 유지되는지
          확인합니다.
        </DialogContentText>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <Typography key={i} variant="body2">
              겹치는 일정 {i + 1}: 회의실 A에서 {9 + i}:00 - {10 + i}:00
            </Typography>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fn()}>취소</Button>
        <Button onClick={fn()} color="error">
          계속 진행
        </Button>
      </DialogActions>
    </Dialog>
  ),
};
