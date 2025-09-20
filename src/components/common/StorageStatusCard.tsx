import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Alert,
} from '@mui/material';
import {
  Storage,
  Refresh,
  Warning,
  CheckCircle,
  Speed,
  Database,
} from '@mui/icons-material';
import { storageService } from '../../services/storage/storageService';

interface StorageStatus {
  users: { count: number; estimatedSize: number };
  products: { count: number; estimatedSize: number };
  cots: { count: number; estimatedSize: number };
  total: {
    count: number;
    estimatedSize: number;
    formattedSize: string;
  };
  isIndexedDB: boolean;
}

interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
  percentage: number;
}

export function StorageStatusCard() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStorageStatus = async () => {
    setLoading(true);
    try {
      const [statusData, quotaData] = await Promise.all([
        storageService.getDatabaseStatus(),
        storageService.getStorageQuota()
      ]);
      
      setStatus(statusData);
      setQuota(quotaData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('스토리지 상태 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageStatus();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageHealthColor = (percentage: number) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  const getPerformanceLevel = (count: number) => {
    if (count < 1000) return { level: '최적', color: 'success' };
    if (count < 10000) return { level: '양호', color: 'info' };
    if (count < 100000) return { level: '보통', color: 'warning' };
    return { level: '주의', color: 'error' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Storage />
            <Typography variant="h6">스토리지 상태</Typography>
          </Box>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            스토리지 정보를 로드하는 중...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!status || !quota) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            스토리지 상태를 로드할 수 없습니다.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalPerformance = getPerformanceLevel(status.total.count);

  return (
    <Card>
      <CardContent>
        {/* 헤더 */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Storage />
            <Typography variant="h6">스토리지 상태</Typography>
            <Chip
              size="small"
              label={status.isIndexedDB ? 'IndexedDB' : 'Memory'}
              color={status.isIndexedDB ? 'success' : 'warning'}
              icon={status.isIndexedDB ? <Database /> : <Speed />}
            />
          </Box>
          <Tooltip title="새로고침">
            <IconButton onClick={loadStorageStatus} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 전체 사용량 */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              브라우저 스토리지 사용량
            </Typography>
            <Typography variant="body2">
              {formatBytes(quota.usage)} / {formatBytes(quota.quota)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={quota.percentage}
            color={getStorageHealthColor(quota.percentage)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary">
            {quota.percentage.toFixed(1)}% 사용 중 • {formatBytes(quota.available)} 남음
          </Typography>
        </Box>

        {/* 데이터 통계 */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {status.users.count.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                질문자
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(status.users.estimatedSize)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary">
                {status.products.count.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                상품
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(status.products.estimatedSize)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {status.cots.count.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CoT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(status.cots.estimatedSize)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 성능 상태 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              성능 상태:
            </Typography>
            <Chip
              size="small"
              label={totalPerformance.level}
              color={totalPerformance.color as any}
              icon={totalPerformance.level === '최적' ? <CheckCircle /> : <Warning />}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            총 {status.total.count.toLocaleString()}개 항목
          </Typography>
        </Box>

        {/* 권장사항 */}
        {status.total.count > 100000 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 대용량 데이터 최적화 팁:
              <br />• 불필요한 데이터 정리를 고려해보세요
              <br />• 검색 시 필터를 활용하여 성능을 향상시키세요
              <br />• 정기적으로 데이터를 Export하여 백업하세요
            </Typography>
          </Alert>
        )}

        {!status.isIndexedDB && status.total.count > 10000 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ⚠️ 현재 메모리 기반 스토리지를 사용 중입니다. 
              대용량 데이터 처리를 위해 IndexedDB 지원 브라우저 사용을 권장합니다.
            </Typography>
          </Alert>
        )}

        {/* 마지막 업데이트 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          마지막 업데이트: {lastUpdated.toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
}
