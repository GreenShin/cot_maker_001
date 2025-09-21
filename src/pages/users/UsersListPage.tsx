import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Button, Box, ButtonGroup, ClickAwayListener, Grow, Paper, Popper, MenuList, MenuItem } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, Add as AddIcon, ArrowDropDown } from '@mui/icons-material';
import { ListLayout } from '../../components/layout/ListLayout';
import { UserSearchFiltersComponent, type UserSearchFiltersProps } from '../../components/users/UserSearchFilters';
import { BulkImportDialog } from '../../components/common/BulkImportDialog';
import { handleExport } from '../shared/importExportActions';
import type { RootState, AppDispatch } from '../../store';
import { 
  fetchUsersWithFilters, 
  setFilters,
  clearFilters,
  type UserSearchFilters as UserSearchFiltersType
} from '../../store/slices/usersSlice';

const columns: GridColDef[] = [
  { field: 'customerSource', headerName: '고객출처', width: 100 },
  { field: 'ageGroup', headerName: '연령대', width: 100 },
  { field: 'gender', headerName: '성별', width: 80 },
  { 
    field: 'ownedProductsCount', 
    headerName: '보유상품', 
    width: 100,
    valueGetter: (value: any, row: any) => {
      return row.ownedProducts?.length || 0;
    },
    renderCell: (params) => (
      <span>{params.value}개</span>
    ),
    sortComparator: (v1: number, v2: number) => v1 - v2,
  },
  { field: 'investmentTendency', headerName: '투자성향', width: 150 },
  { field: 'investmentAmount', headerName: '투자액', width: 150 },
];

export function UsersListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, loading, pagination, filters } = useSelector((state: RootState) => state.users);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportAnchorRef = React.useRef<HTMLDivElement>(null);

  // 초기 데이터 로드 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    dispatch(fetchUsersWithFilters({
      filters: {
        searchKeyword: '',
        customerSource: '',
        ageGroup: '',
        gender: '',
      },
      page: 1,
      pageSize: 50
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 로드만 수행하므로 의존성 배열 비워둠

  // 검색 실행
  const handleSearch = useCallback(() => {
    dispatch(fetchUsersWithFilters({
      filters,
      page: 1, // 검색 시 첫 페이지로 리셋
      pageSize: pagination.pageSize
    }));
  }, [dispatch, filters, pagination.pageSize]);

  // 필터 변경
  const handleFiltersChange = useCallback((newFilters: UserSearchFiltersType) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  // 필터 초기화
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleExportFormat = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      await handleExport(items, { format, entity: 'users' }, 
        () => {
          const formatNames = { csv: 'CSV', json: 'JSON', xlsx: 'Excel' };
          alert(`${formatNames[format]} 파일이 다운로드되었습니다!`);
        },
        (error) => alert(`Export 실패: ${error}`)
      );
    } catch (error) {
      alert(`Export 중 오류: ${error}`);
    }
    setExportMenuOpen(false);
  };

  const handleExportMenuToggle = () => {
    setExportMenuOpen((prevOpen) => !prevOpen);
  };

  const handleExportMenuClose = (event: Event | React.SyntheticEvent) => {
    if (exportAnchorRef.current && exportAnchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setExportMenuOpen(false);
  };

  const toolbar = (
    <>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={() => navigate('/users/new')}
        sx={{ mr: 1 }}
      >
        새로 만들기
      </Button>
      <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImport}>
        Import
      </Button>
      <ButtonGroup variant="outlined" ref={exportAnchorRef}>
        <Button startIcon={<DownloadIcon />} onClick={() => handleExportFormat('csv')}>
          Export
        </Button>
        <Button
          size="small"
          onClick={handleExportMenuToggle}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
    </>
  );

  return (
    <ListLayout title="질문자 리스트" toolbar={toolbar}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        {/* 검색 필터 */}
        <UserSearchFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />
        
        {/* 데이터 그리드 */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
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
            onRowClick={(params) => navigate(`/users/${params.id}`)}
            onPaginationModelChange={(model) => {
              dispatch(fetchUsersWithFilters({
                filters,
                page: model.page + 1,
                pageSize: model.pageSize
              }));
            }}
            // 성능 최적화 옵션
            rowBufferPx={520}
            columnBufferPx={150}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={false}
            density="standard"
          />
        </Box>
        
        <BulkImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          entityType="users"
          onSuccess={(count) => {
            alert(`${count}개 질문자가 성공적으로 import되었습니다.`);
            setImportDialogOpen(false);
            dispatch(fetchUsersWithFilters({ filters, page: 1, pageSize: pagination.pageSize }));
          }}
          onError={(error) => {
            alert(`Import 실패: ${error}`);
          }}
        />
        
        <Popper
          sx={{ zIndex: 1 }}
          open={exportMenuOpen}
          anchorEl={exportAnchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleExportMenuClose}>
                  <MenuList autoFocusItem>
                    <MenuItem onClick={() => handleExportFormat('csv')}>
                      CSV 파일로 내보내기
                    </MenuItem>
                    <MenuItem onClick={() => handleExportFormat('json')}>
                      JSON 파일로 내보내기
                    </MenuItem>
                    <MenuItem onClick={() => handleExportFormat('xlsx')}>
                      Excel 파일로 내보내기
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </ListLayout>
  );
}


