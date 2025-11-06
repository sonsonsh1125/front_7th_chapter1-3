import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

const meta: Meta = {
  title: 'Form Controls/Form States',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const categories = ['업무', '개인', '가족', '기타'];
const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

// 기본 폼 컴포넌트
const EventForm = ({
  title = '',
  date = '',
  startTime = '',
  endTime = '',
  description = '',
  location = '',
  category = '업무',
  isRepeating = false,
  repeatType = 'daily' as RepeatType,
  repeatInterval = 1,
  repeatEndDate = '',
  notificationTime = 10,
  startTimeError = null,
  endTimeError = null,
  isEditing = false,
}: {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  category?: string;
  isRepeating?: boolean;
  repeatType?: RepeatType;
  repeatInterval?: number;
  repeatEndDate?: string;
  notificationTime?: number;
  startTimeError?: string | null;
  endTimeError?: string | null;
  isEditing?: boolean;
}) => (
  <Stack spacing={2} sx={{ width: '100%', maxWidth: '400px' }}>
    <Typography variant="h6">{isEditing ? '일정 수정' : '일정 추가'}</Typography>

    <FormControl fullWidth>
      <FormLabel htmlFor="title">제목</FormLabel>
      <TextField id="title" size="small" value={title} onChange={fn()} />
    </FormControl>

    <FormControl fullWidth>
      <FormLabel htmlFor="date">날짜</FormLabel>
      <TextField id="date" size="small" type="date" value={date} onChange={fn()} />
    </FormControl>

    <Stack direction="row" spacing={2}>
      <FormControl fullWidth>
        <FormLabel htmlFor="start-time">시작 시간</FormLabel>
        <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
          <TextField
            id="start-time"
            size="small"
            type="time"
            value={startTime}
            onChange={fn()}
            error={!!startTimeError}
          />
        </Tooltip>
      </FormControl>
      <FormControl fullWidth>
        <FormLabel htmlFor="end-time">종료 시간</FormLabel>
        <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
          <TextField
            id="end-time"
            size="small"
            type="time"
            value={endTime}
            onChange={fn()}
            error={!!endTimeError}
          />
        </Tooltip>
      </FormControl>
    </Stack>

    <FormControl fullWidth>
      <FormLabel htmlFor="description">설명</FormLabel>
      <TextField id="description" size="small" value={description} onChange={fn()} />
    </FormControl>

    <FormControl fullWidth>
      <FormLabel htmlFor="location">위치</FormLabel>
      <TextField id="location" size="small" value={location} onChange={fn()} />
    </FormControl>

    <FormControl fullWidth>
      <FormLabel id="category-label">카테고리</FormLabel>
      <Select
        id="category"
        size="small"
        value={category}
        onChange={fn()}
        aria-labelledby="category-label"
        aria-label="카테고리"
      >
        {categories.map((cat) => (
          <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
            {cat}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {!isEditing && (
      <FormControl>
        <FormControlLabel
          control={<Checkbox checked={isRepeating} onChange={fn()} />}
          label="반복 일정"
        />
      </FormControl>
    )}

    {isRepeating && !isEditing && (
      <Stack spacing={2}>
        <FormControl fullWidth>
          <FormLabel>반복 유형</FormLabel>
          <Select size="small" value={repeatType} aria-label="반복 유형" onChange={fn()}>
            <MenuItem value="daily" aria-label="daily-option">
              매일
            </MenuItem>
            <MenuItem value="weekly" aria-label="weekly-option">
              매주
            </MenuItem>
            <MenuItem value="monthly" aria-label="monthly-option">
              매월
            </MenuItem>
            <MenuItem value="yearly" aria-label="yearly-option">
              매년
            </MenuItem>
          </Select>
        </FormControl>
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth>
            <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
            <TextField
              id="repeat-interval"
              size="small"
              type="number"
              value={repeatInterval}
              onChange={fn()}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
            <TextField
              id="repeat-end-date"
              size="small"
              type="date"
              value={repeatEndDate}
              onChange={fn()}
            />
          </FormControl>
        </Stack>
      </Stack>
    )}

    <FormControl fullWidth>
      <FormLabel htmlFor="notification">알림 설정</FormLabel>
      <Select id="notification" size="small" value={notificationTime} onChange={fn()}>
        {notificationOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <Button data-testid="event-submit-button" onClick={fn()} variant="contained" color="primary">
      {isEditing ? '일정 수정' : '일정 추가'}
    </Button>
  </Stack>
);

// 스토리들
export const EmptyForm: Story = {
  render: () => <EventForm />,
};

export const FilledForm: Story = {
  render: () => (
    <EventForm
      title="회의"
      date="2024-01-15"
      startTime="10:00"
      endTime="11:00"
      description="팀 회의"
      location="회의실 A"
      category="업무"
      notificationTime={10}
    />
  ),
};

export const FormWithTimeError: Story = {
  render: () => {
    const startTime = '11:00';
    const endTime = '10:00';
    const timeError = getTimeErrorMessage(startTime, endTime);
    return (
      <EventForm
        title="회의"
        date="2024-01-15"
        startTime={startTime}
        endTime={endTime}
        startTimeError={timeError?.startTimeError || null}
        endTimeError={timeError?.endTimeError || null}
      />
    );
  },
};

export const FormWithRepeating: Story = {
  render: () => (
    <EventForm
      title="매일 회의"
      date="2024-01-15"
      startTime="09:00"
      endTime="10:00"
      description="데일리 스탠드업"
      location="온라인"
      category="업무"
      isRepeating={true}
      repeatType="daily"
      repeatInterval={1}
      repeatEndDate="2024-12-31"
      notificationTime={10}
    />
  ),
};

export const FormWithWeeklyRepeating: Story = {
  render: () => (
    <EventForm
      title="주간 회의"
      date="2024-01-15"
      startTime="14:00"
      endTime="15:00"
      description="주간 리뷰"
      location="회의실 A"
      category="업무"
      isRepeating={true}
      repeatType="weekly"
      repeatInterval={1}
      repeatEndDate="2024-12-31"
      notificationTime={60}
    />
  ),
};

export const FormWithMonthlyRepeating: Story = {
  render: () => (
    <EventForm
      title="월간 회의"
      date="2024-01-15"
      startTime="16:00"
      endTime="17:00"
      description="월간 리뷰"
      location="회의실 B"
      category="업무"
      isRepeating={true}
      repeatType="monthly"
      repeatInterval={1}
      repeatEndDate="2024-12-31"
      notificationTime={120}
    />
  ),
};

export const FormWithYearlyRepeating: Story = {
  render: () => (
    <EventForm
      title="연간 회의"
      date="2024-01-15"
      startTime="18:00"
      endTime="19:00"
      description="연간 리뷰"
      location="회의실 C"
      category="업무"
      isRepeating={true}
      repeatType="yearly"
      repeatInterval={1}
      notificationTime={1440}
    />
  ),
};

export const EditingForm: Story = {
  render: () => (
    <EventForm
      title="수정할 회의"
      date="2024-01-15"
      startTime="10:00"
      endTime="11:00"
      description="수정 중인 회의"
      location="회의실 A"
      category="개인"
      notificationTime={60}
      isEditing={true}
    />
  ),
};

export const FormWithLongText: Story = {
  render: () => (
    <EventForm
      title="매우 긴 제목을 가진 일정입니다. 이 일정은 긴 텍스트가 어떻게 표시되는지 테스트하기 위한 것입니다."
      date="2024-01-15"
      startTime="10:00"
      endTime="11:00"
      description="매우 긴 설명입니다. 이 설명은 여러 줄의 텍스트를 포함하고 있으며, 폼 컨트롤이 긴 텍스트를 어떻게 처리하는지 확인하기 위한 것입니다. 텍스트가 길어도 레이아웃이 깨지지 않아야 합니다."
      location="매우 긴 위치 이름입니다. 예를 들어 '서울특별시 강남구 테헤란로 123번지 456호'와 같은 긴 주소가 입력될 수 있습니다."
      category="업무"
      notificationTime={10}
    />
  ),
};

export const FormWithAllCategories: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '800px' }}>
      <Typography variant="h6">카테고리별 폼</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <EventForm title="업무 일정" category="업무" />
        <EventForm title="개인 일정" category="개인" />
        <EventForm title="가족 일정" category="가족" />
        <EventForm title="기타 일정" category="기타" />
      </Stack>
    </Stack>
  ),
};

export const FormWithAllNotificationOptions: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '800px' }}>
      <Typography variant="h6">알림 설정별 폼</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <EventForm title="1분 전 알림" notificationTime={1} />
        <EventForm title="10분 전 알림" notificationTime={10} />
        <EventForm title="1시간 전 알림" notificationTime={60} />
        <EventForm title="2시간 전 알림" notificationTime={120} />
        <EventForm title="1일 전 알림" notificationTime={1440} />
      </Stack>
    </Stack>
  ),
};

export const FormStatesComparison: Story = {
  render: () => (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '1200px' }}>
      <Typography variant="h5">폼 컨트롤 상태 비교</Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            빈 폼
          </Typography>
          <EventForm />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            입력된 폼
          </Typography>
          <EventForm
            title="회의"
            date="2024-01-15"
            startTime="10:00"
            endTime="11:00"
            description="팀 회의"
            location="회의실 A"
            category="업무"
            notificationTime={10}
          />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            시간 오류가 있는 폼
          </Typography>
          <EventForm
            title="회의"
            date="2024-01-15"
            startTime="11:00"
            endTime="10:00"
            startTimeError="시작 시간이 종료 시간보다 늦습니다."
            endTimeError="종료 시간이 시작 시간보다 빠릅니다."
          />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            반복 일정 폼
          </Typography>
          <EventForm
            title="매일 회의"
            date="2024-01-15"
            startTime="09:00"
            endTime="10:00"
            isRepeating={true}
            repeatType="daily"
            repeatInterval={1}
            repeatEndDate="2024-12-31"
          />
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            편집 모드 폼
          </Typography>
          <EventForm
            title="수정할 회의"
            date="2024-01-15"
            startTime="10:00"
            endTime="11:00"
            isEditing={true}
          />
        </Box>
      </Stack>
    </Stack>
  ),
};

// 개별 컨트롤 상태 테스트
export const TextFieldStates: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '400px' }}>
      <Typography variant="h6">TextField 상태</Typography>
      <FormControl fullWidth>
        <FormLabel>기본 상태</FormLabel>
        <TextField size="small" placeholder="입력하세요" />
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>입력된 값</FormLabel>
        <TextField size="small" value="입력된 텍스트" onChange={fn()} />
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>에러 상태</FormLabel>
        <TextField size="small" error helperText="오류 메시지" />
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>비활성화</FormLabel>
        <TextField size="small" disabled value="비활성화된 필드" />
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>긴 텍스트</FormLabel>
        <TextField
          size="small"
          value="매우 긴 텍스트입니다. 이 텍스트는 오버플로우 처리를 테스트하기 위한 것입니다."
          onChange={fn()}
        />
      </FormControl>
    </Stack>
  ),
};

export const SelectStates: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: '400px' }}>
      <Typography variant="h6">Select 상태</Typography>
      <FormControl fullWidth>
        <FormLabel>기본 선택</FormLabel>
        <Select size="small" value="업무" onChange={fn()}>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>다른 선택</FormLabel>
        <Select size="small" value="개인" onChange={fn()}>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>비활성화</FormLabel>
        <Select size="small" value="업무" disabled onChange={fn()}>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  ),
};

export const CheckboxStates: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: '400px' }}>
      <Typography variant="h6">Checkbox 상태</Typography>
      <FormControlLabel control={<Checkbox checked={false} onChange={fn()} />} label="체크 안됨" />
      <FormControlLabel control={<Checkbox checked={true} onChange={fn()} />} label="체크됨" />
      <FormControlLabel
        control={<Checkbox checked={false} disabled onChange={fn()} />}
        label="비활성화 (체크 안됨)"
      />
      <FormControlLabel
        control={<Checkbox checked={true} disabled onChange={fn()} />}
        label="비활성화 (체크됨)"
      />
    </Stack>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: '400px' }}>
      <Typography variant="h6">Button 상태</Typography>
      <Button variant="contained" color="primary" onClick={fn()}>
        일정 추가
      </Button>
      <Button variant="contained" color="primary" onClick={fn()}>
        일정 수정
      </Button>
      <Button variant="outlined" color="primary" onClick={fn()}>
        취소
      </Button>
      <Button variant="text" color="primary" onClick={fn()}>
        텍스트 버튼
      </Button>
      <Button variant="contained" color="primary" disabled onClick={fn()}>
        비활성화
      </Button>
    </Stack>
  ),
};
