import React from 'react';
import { Box, TextField, TextFieldProps } from '@mui/material';
import { TextareaResizer } from './TextareaResizer';

interface ResizableTextFieldProps extends Omit<TextFieldProps, 'rows'> {
  fieldName: string;
  rows: number;
  heightPx: number;
  onHeightChange: (fieldName: string, deltaPx: number) => void;
}

export function ResizableTextField({
  fieldName,
  rows,
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
        rows={rows}
        sx={{
          width: '100%',
          '& .MuiInputBase-root': {
            minHeight: `${heightPx}px`,
          },
          '& .MuiInputBase-inputMultiline': {
            minHeight: `${heightPx - 16}px`, // padding 고려
            resize: 'none', // 기본 resize 핸들 비활성화
          },
          ...textFieldProps.sx,
        }}
      />
      <TextareaResizer onResize={handleResize} />
    </Box>
  );
}
