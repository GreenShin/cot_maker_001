import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchUsers, fetchUsersWithFilters, type UserSearchFilters } from '../../store/slices/usersSlice';
import { UserAnon } from '../../models/userAnon';

interface UserSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: UserAnon) => void;
  selectedUserId?: string;
}

const columns: GridColDef[] = [
  { field: 'customerSource', headerName: '고객출처', width: 100 },
  { field: 'ageGroup', headerName: '연령대', width: 100 },
  { field: 'gender', headerName: '성별', width: 80 },
  { field: 'investmentTendency', headerName: '투자성향', width: 150 },
  { field: 'investmentAmount', headerName: '투자액', width: 150 },
];

export function UserSelectorDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedUserId 
}: UserSelectorDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, pagination } = useSelector((state: RootState) => state.users);
  
  const [filters, setFilters] = React.useState({
    gender: '',
    ageGroup: '',
    customerSource: '',
  });
  
  const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>([]);

  React.useEffect(() => {
    if (open) {
      // 다이얼로그 열릴 때 필터 초기화 및 전체 목록 로드
      setFilters({
        gender: '',
        ageGroup: '',
        customerSource: '',
      });
      dispatch(fetchUsers({}));
    }
  }, [open, dispatch]);

  React.useEffect(() => {
    if (selectedUserId) {
      setSelectionModel([selectedUserId]);
    }
  }, [selectedUserId]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    const searchFilters: UserSearchFilters = {
      searchKeyword: '',
      customerSource: filters.customerSource,
      ageGroup: filters.ageGroup,
      gender: filters.gender,
    };
    dispatch(fetchUsersWithFilters({ filters: searchFilters }));
  };

  const handleSelect = () => {
    if (selectionModel.length > 0) {
      const selectedUser = items.find(user => user.id === selectionModel[0]);
      if (selectedUser) {
        onSelect(selectedUser);
        onClose();
      }
    }
  };

  const handleRowDoubleClick = (params: any) => {
    const selectedUser = items.find(user => user.id === params.id);
    if (selectedUser) {
      onSelect(selectedUser);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectionModel([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          질문자 선택
        </Typography>
        <Typography variant="caption" color="text.secondary">
          행을 클릭하여 선택하거나, 더블클릭하면 바로 적용됩니다
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* 필터 섹션 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pt: 1, alignItems: 'flex-end' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>고객출처</InputLabel>
            <Select
              value={filters.customerSource}
              label="고객출처"
              onChange={(e) => handleFilterChange('customerSource', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="증권">증권</MenuItem>
              <MenuItem value="보험">보험</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>연령대</InputLabel>
            <Select
              value={filters.ageGroup}
              label="연령대"
              onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="10대">10대</MenuItem>
              <MenuItem value="20대">20대</MenuItem>
              <MenuItem value="30대">30대</MenuItem>
              <MenuItem value="40대">40대</MenuItem>
              <MenuItem value="50대">50대</MenuItem>
              <MenuItem value="60대">60대</MenuItem>
              <MenuItem value="70대">70대</MenuItem>
              <MenuItem value="80대 이상">80대 이상</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>성별</InputLabel>
            <Select
              value={filters.gender}
              label="성별"
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="남">남성</MenuItem>
              <MenuItem value="여">여성</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            검색
          </Button>
        </Box>

        {/* 사용자 목록 */}
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
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
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            onRowDoubleClick={handleRowDoubleClick}
            // 성능 최적화 옵션
            rowBufferPx={260}
            columnBufferPx={156}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={true}
            density="compact"
            sx={{ 
              border: 0,
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>
          취소
        </Button>
        <Button 
          onClick={handleSelect} 
          variant="contained"
          disabled={selectionModel.length === 0}
        >
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}
