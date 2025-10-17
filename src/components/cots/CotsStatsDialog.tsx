import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
  Grid2,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { CoTQA } from '../../models/cotqa';
import type { UserAnon } from '../../models/userAnon';

interface CotsStatsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface StatItem {
  label: string;
  count: number;
  percentage?: number;
}

// 비율 계산 함수
const calculatePercentage = (count: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((count / total) * 100 * 10) / 10; // 소수점 첫째자리까지
};

export function CotsStatsDialog({ open, onClose }: CotsStatsDialogProps) {
  const { items: cots } = useSelector((state: RootState) => state.cots);
  const { items: users } = useSelector((state: RootState) => state.users);
  const [productSourceFilter, setProductSourceFilter] = useState<'전체' | '증권' | '보험'>('전체');
  
  const totalCots = cots.length;

  // 상품분류별 카운트
  const productSourceStats = useMemo(() => {
    const stats: StatItem[] = [
      { label: '증권', count: cots.filter(c => c.productSource === '증권').length },
      { label: '보험', count: cots.filter(c => c.productSource === '보험').length },
    ];
    return stats.map(stat => ({
      ...stat,
      percentage: calculatePercentage(stat.count, totalCots)
    }));
  }, [cots, totalCots]);

  // 질문유형별 카운트 (필터 적용)
  const questionTypeStats = useMemo(() => {
    const filteredCots = productSourceFilter === '전체' 
      ? cots 
      : cots.filter(c => c.productSource === productSourceFilter);
    
    const filteredTotal = filteredCots.length;
    
    const countMap = new Map<string, number>();
    filteredCots.forEach(cot => {
      const type = cot.questionType;
      countMap.set(type, (countMap.get(type) || 0) + 1);
    });

    return Array.from(countMap.entries())
      .map(([label, count]) => ({ 
        label, 
        count,
        percentage: calculatePercentage(count, filteredTotal)
      }))
      .sort((a, b) => b.count - a.count);
  }, [cots, productSourceFilter]);

  // 질문자 정보 통계 - CoT에 저장된 성별/연령대 사용
  const questionerStats = useMemo(() => {
    // 성별 통계 - CoT의 questionerGender 필드 사용
    const genderMap = new Map<string, number>();
    cots.forEach(cot => {
      const gender = (cot as any).questionerGender || '미정의';
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });

    const genderStats = Array.from(genderMap.entries())
      .map(([label, count]) => ({ 
        label, 
        count,
        percentage: calculatePercentage(count, totalCots)
      }))
      .sort((a, b) => b.count - a.count);

    // 연령대 통계 - CoT의 questionerAgeGroup 필드 사용
    const ageMap = new Map<string, number>();
    cots.forEach(cot => {
      const age = (cot as any).questionerAgeGroup || '미정의';
      ageMap.set(age, (ageMap.get(age) || 0) + 1);
    });

    const ageStats = Array.from(ageMap.entries())
      .map(([label, count]) => ({ 
        label, 
        count,
        percentage: calculatePercentage(count, totalCots)
      }))
      .sort((a, b) => {
        // 연령대 순서 정렬
        const ageOrder = ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상', '미정의'];
        return ageOrder.indexOf(a.label) - ageOrder.indexOf(b.label);
      });

    return { genderStats, ageStats };
  }, [cots, totalCots]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          CoT 통계
        </Typography>
        <Typography variant="caption" color="text.secondary">
          현재 저장된 {cots.length}개의 CoT 데이터 기준
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 상품분류별 통계 */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              상품분류별 통계
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
              {productSourceStats.map(stat => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stat.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({stat.percentage}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Divider />

          {/* 질문유형별 통계 */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              질문유형별 통계
            </Typography>
            
            <RadioGroup
              row
              value={productSourceFilter}
              onChange={(e) => setProductSourceFilter(e.target.value as '전체' | '증권' | '보험')}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="전체" control={<Radio />} label="전체" />
              <FormControlLabel value="증권" control={<Radio />} label="증권" />
              <FormControlLabel value="보험" control={<Radio />} label="보험" />
            </RadioGroup>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {questionTypeStats.length > 0 ? (
                questionTypeStats.map(stat => (
                  <Box 
                    key={stat.label} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Typography variant="body2">{stat.label}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {stat.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({stat.percentage}%)
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  데이터가 없습니다
                </Typography>
              )}
            </Box>
          </Paper>

          <Divider />

          {/* 질문자 통계 */}
          <Grid2 container spacing={2}>
            {/* 성별 통계 */}
            <Grid2 size={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  질문자 성별
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {questionerStats.genderStats.length > 0 ? (
                    questionerStats.genderStats.map(stat => (
                      <Box 
                        key={stat.label}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Typography variant="body2">{stat.label}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {stat.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({stat.percentage}%)
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      데이터가 없습니다
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid2>

            {/* 연령대 통계 */}
            <Grid2 size={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  질문자 연령대
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {questionerStats.ageStats.length > 0 ? (
                    questionerStats.ageStats.map(stat => (
                      <Box 
                        key={stat.label}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Typography variant="body2">{stat.label}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {stat.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({stat.percentage}%)
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      데이터가 없습니다
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid2>
          </Grid2>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

