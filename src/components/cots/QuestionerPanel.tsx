import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { UserAnon } from '../../models/userAnon';

interface QuestionerPanelProps {
  selectedUser: UserAnon | null;
  onOpenUserSelector: () => void;
}

export function QuestionerPanel({ 
  selectedUser, 
  onOpenUserSelector 
}: QuestionerPanelProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* 고정 헤더 */}
      <Box sx={{ 
        flexShrink: 0, 
        borderBottom: 1, 
        borderColor: 'divider', 
        pb: 1, 
        mb: 2 
      }}>
        <Typography variant="h6">
          질문자 선택 (선택사항)
        </Typography>
      </Box>
      
      {/* 스크롤 가능한 콘텐츠 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
      
      {!selectedUser ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            질문자 선택은 선택사항입니다. 필요시 선택해 주세요.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={onOpenUserSelector}
          >
            질문자 검색
          </Button>
        </Box>
      ) : (
        <Box>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                선택된 질문자
              </Typography>
              <Typography variant="body2">
                <strong>고객출처:</strong> {selectedUser.customerSource}<br />
                <strong>연령대:</strong> {selectedUser.ageGroup}<br />
                <strong>성별:</strong> {selectedUser.gender}<br />
                <strong>투자성향:</strong> {selectedUser.customerSource === '증권' && 'investmentTendency' in selectedUser ? selectedUser.investmentTendency : '미정의'}<br />
                <strong>투자액:</strong> {selectedUser.investmentAmount}
              </Typography>
            </CardContent>
          </Card>
          
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            size="small"
            onClick={onOpenUserSelector}
          >
            다른 질문자 선택
          </Button>
        </Box>
      )}
      </Box>
    </Box>
  );
}
