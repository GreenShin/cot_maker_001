import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { UserAnon } from '../../models/userAnon';
import type { PaginatedResult, QueryOptions } from '../../services/storage/storage';
import { storageService } from '../../services/storage/storageService';
import type { SearchFilters } from '../../services/query/queryService';

export interface UsersState {
  items: UserAnon[];
  selectedUser: UserAnon | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: SearchFilters;
}

const initialState: UsersState = {
  items: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  },
  filters: {}
};

// 스토리지 서비스 사용
const storage = storageService.users;

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (options: Partial<QueryOptions> = {}) => {
    return await storage.getPaginated(options);
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id: string) => {
    const user = await storage.getById(id);
    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<UserAnon | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '질문자 목록 조회 실패';
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selectedUser = action.payload;
      });
  }
});

export const { setSelectedUser, setFilters, setPage, clearError } = usersSlice.actions;
export default usersSlice.reducer;
