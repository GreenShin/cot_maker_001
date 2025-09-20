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
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchUsers } from '../../store/slices/usersSlice';
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
    // TODO: 필터링된 사용자 목록 요청
    // dispatch(searchUsers({ filters: { ...filters, [field]: value } }));
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
      <DialogTitle>질문자 선택</DialogTitle>
      
      <DialogContent>
        {/* 필터 섹션 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pt: 1 }}>
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
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            // 성능 최적화 옵션
            rowBuffer={5}
            columnBuffer={3}
            rowHeight={52}
            disableVirtualization={false}
            keepNonExistentRowsSelected={true}
            density="compact"
            sx={{ border: 0 }}
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
