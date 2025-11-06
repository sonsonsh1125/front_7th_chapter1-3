import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import RecurringEventDialog from './RecurringEventDialog';
import { Event } from '../types';

const meta = {
  title: 'Components/RecurringEventDialog',
  component: RecurringEventDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['edit', 'delete', 'move'],
      description: 'The operation mode of the dialog',
    },
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
  },
  args: {
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof RecurringEventDialog>;

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

export const EditMode: Story = {
  args: {
    open: true,
    mode: 'edit',
    event: mockEvent,
  },
};

export const DeleteMode: Story = {
  args: {
    open: true,
    mode: 'delete',
    event: mockEvent,
  },
};

export const MoveMode: Story = {
  args: {
    open: true,
    mode: 'move',
    event: mockEvent,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    mode: 'edit',
    event: mockEvent,
  },
};

export const WithoutEvent: Story = {
  args: {
    open: true,
    mode: 'edit',
    event: null,
  },
};

