import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { UserAnon } from '../../models/userAnon';
import type { PaginatedResult, QueryOptions } from '../../services/storage/storage';
import { storageService } from '../../services/storage/storageService';

// 질문자 검색 필터 타입
export interface UserSearchFilters {
  searchKeyword: string;
  customerSource: string;
  ageGroup: string;
  gender: string;
}

export interface UsersState {
  items: UserAnon[];
  currentUser: UserAnon | null;
  selectedUser: UserAnon | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: UserSearchFilters;
}

const initialState: UsersState = {
  items: [],
  currentUser: null,
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  },
  filters: {
    searchKeyword: '',
    customerSource: '',
    ageGroup: '',
    gender: '',
  }
};

// 스토리지 서비스 사용
const storage = storageService.users;

// 검색 필터를 쿼리 옵션으로 변환
const buildUserQueryOptions = (
  filters: UserSearchFilters, 
  page: number = 1, 
  pageSize: number = 50
): QueryOptions => {
  const queryFilters: Record<string, any> = {};

  // 고객출처 필터
  if (filters.customerSource) {
    queryFilters.customerSource = filters.customerSource;
  }

  // 연령대 필터
  if (filters.ageGroup) {
    queryFilters.ageGroup = filters.ageGroup;
  }

  // 성별 필터
  if (filters.gender) {
    queryFilters.gender = filters.gender;
  }

  return {
    page,
    pageSize,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    search: filters.searchKeyword, // 보유상품 검색용
    filters: queryFilters,
  };
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (options: Partial<QueryOptions> = {}) => {
    return await storage.getPaginated(options);
  }
);

// 필터링된 질문자 목록 조회
export const fetchUsersWithFilters = createAsyncThunk(
  'users/fetchUsersWithFilters',
  async (params: { filters: UserSearchFilters; page?: number; pageSize?: number }) => {
    const { filters, page = 1, pageSize = 50 } = params;
    const queryOptions = buildUserQueryOptions(filters, page, pageSize);
    return await storage.getPaginated(queryOptions);
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

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<UserAnon, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      console.log('Creating user with data:', userData);
      const newUser = await storage.create(userData);
      console.log('User created successfully:', newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: string; data: Partial<UserAnon> }, { rejectWithValue }) => {
    try {
      console.log('Updating user:', id, 'with data:', data);
      const updatedUser = await storage.update(id, data);
      console.log('User updated successfully:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    const success = await storage.delete(id);
    if (!success) {
      throw new Error(`Failed to delete user with id ${id}`);
    }
    return id;
  }
);

export const importUsers = createAsyncThunk(
  'users/importUsers',
  async (usersData: UserAnon[], { rejectWithValue }) => {
    try {
      console.log('Importing Users data:', usersData.length);
      const results = [];
      
      // 배치 단위로 import 처리
      const batchSize = 100;
      for (let i = 0; i < usersData.length; i += batchSize) {
        const batch = usersData.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(user => storage.create(user))
        );
        
        const successfulResults = batchResults
          .filter((result): result is PromiseFulfilledResult<UserAnon> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);
          
        results.push(...successfulResults);
      }
      
      console.log('Users imported successfully:', results.length);
      return results;
    } catch (error) {
      console.error('Error importing users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserAnon | null>) => {
      state.currentUser = action.payload;
    },
    setSelectedUser: (state, action: PayloadAction<UserAnon | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<UserSearchFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        searchKeyword: '',
        customerSource: '',
        ageGroup: '',
        gender: '',
      };
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
      
      // fetchUsersWithFilters
      .addCase(fetchUsersWithFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersWithFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchUsersWithFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '질문자 검색 실패';
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '질문자 조회 실패';
      })
      
      // createUser
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // 새 항목을 맨 앞에 추가
        state.currentUser = action.payload;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '질문자 생성 실패';
      })
      
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '질문자 수정 실패';
      })
      
      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '질문자 삭제 실패';
      })
      
      // importUsers
      .addCase(importUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importUsers.fulfilled, (state, action) => {
        state.loading = false;
        // Import된 항목들을 기존 목록에 추가
        state.items.unshift(...action.payload);
      })
      .addCase(importUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || '질문자 Import 실패';
      });
  }
});

export const { 
  setCurrentUser, 
  setSelectedUser, 
  setFilters, 
  clearFilters, 
  setPage, 
  clearError 
} = usersSlice.actions;
export default usersSlice.reducer;
