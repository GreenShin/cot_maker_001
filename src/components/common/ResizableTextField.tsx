import React from 'react';
import { Box, TextField, TextFieldProps } from '@mui/material';
import { TextareaResizer } from './TextareaResizer';

interface ResizableTextFieldProps extends Omit<TextFieldProps, 'rows'> {
  fieldName: string;
  rows: number; // 호환성을 위해 남겨두지만 사용하지 않음
  heightPx: number;
  onHeightChange: (fieldName: string, deltaPx: number) => void;
}

export function ResizableTextField({
  fieldName,
  rows, // eslint-disable-line @typescript-eslint/no-unused-vars
  heightPx,
  onHeightChange,
  ...textFieldProps
}: ResizableTextFieldProps) {
  const handleResize = (deltaPx: number) => {
    onHeightChange(fieldName, deltaPx);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        {...textFieldProps}
        multiline
        sx={{
          width: '100%',
          '& .MuiInputBase-root': {
            height: `${heightPx}px`, // rows 대신 직접 픽셀 높이 설정
            alignItems: 'flex-start',
          },
          '& .MuiInputBase-inputMultiline': {
            height: '100% !important', // 부모 높이에 맞춤
            overflow: 'auto !important', // 스크롤 활성화
            resize: 'none', // 기본 resize 핸들 비활성화
          },
          ...textFieldProps.sx,
        }}
      />
      <TextareaResizer onResize={handleResize} />
    </Box>
  );
}
