import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Event } from '../types';

const meta = {
  title: 'Components/OverlapDialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOverlappingEvents: Event[] = [
  {
    id: '1',
    title: '기존 회의',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 회의',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'none',
      interval: 0,
    },
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
    repeat: {
      type: 'none',
      interval: 0,
    },
    notificationTime: 60,
  },
];

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

export const SingleOverlap: Story = {
  render: (args) => (
    <OverlapDialog
      {...args}
      overlappingEvents={[mockOverlappingEvents[0]]}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
  args: {
    open: true,
  },
};

export const MultipleOverlaps: Story = {
  render: (args) => (
    <OverlapDialog
      {...args}
      overlappingEvents={mockOverlappingEvents}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
  args: {
    open: true,
  },
};

export const Closed: Story = {
  render: (args) => (
    <OverlapDialog
      {...args}
      overlappingEvents={mockOverlappingEvents}
      onClose={fn()}
      onConfirm={fn()}
    />
  ),
  args: {
    open: false,
  },
};
