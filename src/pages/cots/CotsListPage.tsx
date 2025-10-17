import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { Add as AddIcon, Upload as UploadIcon, Download as DownloadIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import { BulkImportDialog } from '../../components/common/BulkImportDialog';
import { ExportDialog } from '../../components/common/ExportDialog';
import { CotsStatsDialog } from '../../components/cots/CotsStatsDialog';
import type { RootState, AppDispatch } from '../../store';
import { fetchCoTs, fetchAllCoTsForExport, searchCoTs, setFilters } from '../../store/slices/cotsSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import type { SearchFilters } from '../../services/query/queryService';

const columns: GridColDef[] = [
  { field: 'productSource', headerName: '상품분류', width: 100 },
  { field: 'questionType', headerName: '질문유형', width: 200 },
  { field: 'questionerGender', headerName: '성별', width: 80 },
  { field: 'questionerAgeGroup', headerName: '연령대', width: 100 },
  { field: 'question', headerName: '질문', width: 300, flex: 1 },
  { field: 'author', headerName: '작성자', width: 120 },
  { field: 'createdAt', headerName: '등록일', width: 120 },
  { field: 'updatedAt', headerName: '수정일', width: 120 },
];

export function CoTsListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, pagination, filters } = useSelector((state: RootState) => state.cots);
  
  const [searchText, setSearchText] = useState(filters.text || '');
  const [productSource, setProductSource] = useState(filters.productSource || '');
  const [questionType, setQuestionType] = useState(filters.questionType || '');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchCoTs({}));
    dispatch(fetchUsers({})); // 통계를 위해 사용자 데이터 로드
  }, [dispatch]);

  const handleSearch = () => {
    const newFilters: SearchFilters = {
      text: searchText,
      productSource: productSource as '증권' | '보험' | undefined,
      questionType: questionType || undefined,
    };
    
    dispatch(setFilters(newFilters));
    dispatch(searchCoTs({ filters: newFilters }));
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      // 전체 데이터 조회
      const result = await dispatch(fetchAllCoTsForExport());
      
      if (fetchAllCoTsForExport.fulfilled.match(result)) {
        const allCots = result.payload;
        setExportData(allCots);
        setExportDialogOpen(true);
      } else {
        throw new Error('전체 데이터 조회 실패');
      }
    } catch (error) {
      alert(`Export 준비 중 오류: ${error}`);
    }
  };

  const toolbar = (
    <>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={() => navigate('/cots/new')}
      >
        새 CoT 생성
      </Button>
      <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => setStatsDialogOpen(true)}>
        통계
      </Button>
      <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
        Import
      </Button>
      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
        Export
      </Button>
    </>
  );

  const searchBar = (
    <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
      <TextField
        label="검색"
        placeholder="질문, CoT, 답변에서 검색..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ minWidth: 300 }}
      />
      
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>상품분류</InputLabel>
        <Select
          value={productSource}
          label="상품분류"
          onChange={(e) => setProductSource(e.target.value)}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="증권">증권</MenuItem>
          <MenuItem value="보험">보험</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>질문유형</InputLabel>
        <Select
          value={questionType}
          label="질문유형"
          onChange={(e) => setQuestionType(e.target.value)}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="고객 특성 강조형">고객 특성 강조형</MenuItem>
          <MenuItem value="투자성향 및 조건 기반형">투자성향 및 조건 기반형</MenuItem>
          <MenuItem value="상품비교 추천형">상품비교 추천형</MenuItem>
          <MenuItem value="연령별 및 생애주기 저축성 상품 추천형">연령별 및 생애주기 저축성 상품 추천형</MenuItem>
          <MenuItem value="투자성 상품 추천형">투자성 상품 추천형</MenuItem>
          <MenuItem value="건강 및 질병 보장 대비형">건강 및 질병 보장 대비형</MenuItem>
        </Select>
      </FormControl>

      <Button variant="contained" onClick={handleSearch}>
        검색
      </Button>
    </Box>
  );

  return (
    <ListLayout title="CoTs" toolbar={toolbar}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        {searchBar}
        <Box sx={{ flex: 1, minHeight: 0, mt: 2 }}>
          <DataGrid
            sx={{ 
              border: 0,
              height: '100%',
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
              }
            }}
        rows={items}
        columns={columns}
        loading={loading}
        pagination
        paginationMode="server"
        rowCount={pagination.total}
        paginationModel={{
          page: pagination.page - 1,
          pageSize: pagination.pageSize
        }}
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick
        onRowClick={(params) => navigate(`/cots/${params.id}`)}
        // 성능 최적화 옵션
        rowBufferPx={520}
        columnBufferPx={260}
        rowHeight={52}
        disableVirtualization={false}
        keepNonExistentRowsSelected={false}
        density="standard"
      />
        </Box>
      
      <BulkImportDialog
        open={importDialogOpen}
        onClose={(shouldRefresh) => {
          setImportDialogOpen(false);
          if (shouldRefresh) {
            dispatch(fetchCoTs({})); // 목록 새로고침
          }
        }}
        entityType="cots"
        onSuccess={() => {
          // Alert 제거 - 팝업 내에서 성공 메시지 표시
        }}
        onError={(error) => {
          alert(`Import 실패: ${error}`);
        }}
      />
      
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        entityType="cots"
        data={exportData}
      />
      
      <CotsStatsDialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
      />
      </Box>
    </ListLayout>
  );
}


