import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Button,
  Box,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  Close as CloseIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { RootState, AppDispatch } from '../../store';
import {
  initializeSettings,
  setAuthor,
  setCategory,
  setCurrentTab,
  setTabField,
  setFontSize,
  toggleTheme,
  resetToDefaults,
  type SecuritiesTabType,
  type InsuranceTabType,
  type TabContent
} from '../../store/slices/settingsSlice';
import { exportSettings, importSettings } from '../../store/persistence/settingsPersistence';
import { useResizablePanels } from '../../hooks/useResizablePanels';
import { useTextareaHeights } from '../../hooks/useTextareaHeights';

export function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);
  const { resetPanelSizes } = useResizablePanels();
  const { resetHeights } = useTextareaHeights();
  
  // 미리보기 Dialog 상태
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 설정 초기화는 App 컴포넌트에서 처리

  const handleAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setAuthor(event.target.value));
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCategory(event.target.value as '증권' | '보험'));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    dispatch(setCurrentTab({
      category: settings.category,
      tab: newValue as SecuritiesTabType | InsuranceTabType
    }));
  };

  const handleFieldChange = (field: keyof TabContent) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTab = settings.category === '증권' 
      ? settings.currentTab.증권 
      : settings.currentTab.보험;
    
    dispatch(setTabField({
      category: settings.category,
      tab: currentTab,
      field,
      value: event.target.value
    }));
  };

  const handleFontSizeChange = (_: Event, value: number | number[]) => {
    dispatch(setFontSize(value as number));
  };

  const handleReset = () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      dispatch(resetToDefaults());
    }
  };

  const handlePanelReset = () => {
    if (confirm('패널 크기를 기본값으로 초기화하시겠습니까?')) {
      resetPanelSizes();
    }
  };

  const handleTextareaReset = () => {
    if (confirm('텍스트 영역 높이를 기본값으로 초기화하시겠습니까?')) {
      resetHeights();
    }
  };

  const handlePreviewOpen = (content: string, title: string) => {
    setPreviewContent(content);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // 설정 내보내기
  const handleExport = () => {
    try {
      // localStorage 확인
      const localStorageData = localStorage.getItem('cotAdminSettings');
      console.log('=== Export Debug ===');
      console.log('localStorage 원본 데이터:', localStorageData);
      
      const settingsJson = exportSettings();
      console.log('Export할 JSON:', settingsJson);
      
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('설정 내보내기 실패:', error);
      alert('설정 내보내기에 실패했습니다.');
    }
  };

  // 설정 가져오기
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        console.log('=== Import Debug ===');
        console.log('Import할 파일 내용:', content);
        
        const success = importSettings(content);
        
        if (success) {
          const afterImportData = localStorage.getItem('cotAdminSettings');
          console.log('Import 후 localStorage 데이터:', afterImportData);
          
          // Redux 스토어 다시 로드
          dispatch(initializeSettings());
          alert('설정이 성공적으로 가져오기되었습니다.');
        } else {
          alert('설정 파일 형식이 올바르지 않습니다.');
        }
      } catch (error) {
        console.error('설정 가져오기 실패:', error);
        alert('설정 가져오기에 실패했습니다.');
      }
    };
    reader.readAsText(file);
    
    // 같은 파일을 다시 선택할 수 있도록 value 초기화
    event.target.value = '';
  };

  // 현재 탭 정보
  const currentTabKey = settings.category === '증권' 
    ? settings.currentTab.증권 
    : settings.currentTab.보험;
  
  // 현재 탭의 콘텐츠
  const currentTabContent = settings.category === '증권'
    ? settings.tabs.증권[settings.currentTab.증권]
    : settings.tabs.보험[settings.currentTab.보험];

  // 탭 레이블 맵핑
  const tabLabels: Record<'증권' | '보험', Record<string, string>> = {
    증권: {
      고객특성강조형: '고객 특성 강조형',
      투자성향조건기반형: '투자성향 및 조건 기반형',
      상품비교추천형: '상품비교 추천형'
    },
    보험: {
      연령별생애주기저축성: '연령별 및 생애주기 저축성 상품 추천형',
      투자성상품추천형: '투자성 상품 추천형',
      건강질병보장대비형: '건강 및 질병 보장 대비형'
    }
  };

  // 현재 상품분류의 탭 목록
  const currentTabs: readonly string[] = settings.category === '증권'
    ? ['고객특성강조형', '투자성향조건기반형', '상품비교추천형']
    : ['연령별생애주기저축성', '투자성상품추천형', '건강질병보장대비형'];

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        flexShrink: 0, 
        maxWidth: '100%', 
        mx: 'auto', 
        width: '100%',
        px: 2,
        pt: 3,
        pb: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1
        }}>
          <Typography variant="h4" component="h1">
            설정
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              size="small"
            >
              IMPORT
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImport}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
            >
              EXPORT
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        px: 2
      }}>
        <Box sx={{ maxWidth: '100%', mx: 'auto', pb: 3 }}>
          <Stack spacing={3}>
            {/* CoT 가이드 섹션 */}
            <Paper sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    CoT 가이드
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>

                {/* 상품분류 */}
                <FormControl component="fieldset">
                  <FormLabel component="legend">상품분류</FormLabel>
                  <RadioGroup
                    row
                        value={settings.category}
                        onChange={handleCategoryChange}
                  >
                    <FormControlLabel 
                      value="증권" 
                      control={<Radio />} 
                      label="증권" 
                    />
                    <FormControlLabel 
                      value="보험" 
                      control={<Radio />} 
                      label="보험" 
                    />
                  </RadioGroup>
                </FormControl>

                {/* 탭 영역 */}
                <Box>
                  <Tabs 
                        value={currentTabKey} 
                        onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    {currentTabs.map((tab) => (
                      <Tab 
                        key={tab} 
                        label={tabLabels[settings.category][tab]} 
                        value={tab}
                      />
                    ))}
                  </Tabs>

                  <Box sx={{ pt: 3 }}>
                    <Stack spacing={3}>
                      {/* 질문자 주관적 판단 */}
                      <TextField
                        label="질문자 주관적 판단"
                        value={currentTabContent.questionerJudgment}
                        onChange={handleFieldChange('questionerJudgment')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="질문자의 주관적 판단이나 메모를 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.questionerJudgment, '질문자 주관적 판단')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* 질문 */}
                      <TextField
                        label="질문"
                        value={currentTabContent.question}
                        onChange={handleFieldChange('question')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="질문 내용을 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.question, '질문')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* CoT1 */}
                      <TextField
                        label="CoT1"
                        value={currentTabContent.cot1}
                        onChange={handleFieldChange('cot1')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="CoT1 내용을 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.cot1, 'CoT1')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* CoT2 */}
                      <TextField
                        label="CoT2"
                        value={currentTabContent.cot2}
                        onChange={handleFieldChange('cot2')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="CoT2 내용을 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.cot2, 'CoT2')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* CoT3 */}
                      <TextField
                        label="CoT3"
                        value={currentTabContent.cot3}
                        onChange={handleFieldChange('cot3')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="CoT3 내용을 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.cot3, 'CoT3')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* 답변 */}
                      <TextField
                        label="답변"
                        value={currentTabContent.answer}
                        onChange={handleFieldChange('answer')}
                        fullWidth
                        multiline
                        rows={4}
                        helperText="답변 내용을 입력하세요 (Markdown 지원)"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                <IconButton
                                  onClick={() => handlePreviewOpen(currentTabContent.answer, '답변')}
                                  edge="end"
                                  aria-label="미리보기"
                                  title="마크다운 미리보기"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            {/* 기타 설정 섹션 */}
            <Paper sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* 작성자 이름 */}
                <TextField
                  label="작성자 이름"
                  value={settings.author}
                  onChange={handleAuthorChange}
                  fullWidth
                  helperText="새로 생성되는 CoT의 기본 작성자입니다"
                />

                {/* 글꼴 크기 슬라이더 */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    글꼴 크기: {settings.fontSize}px
                  </Typography>
                  <Slider
                        value={settings.fontSize}
                        onChange={handleFontSizeChange}
                    min={10}
                    max={24}
                    step={1}
                    marks={[
                      { value: 10, label: '10px' },
                      { value: 14, label: '14px' },
                      { value: 18, label: '18px' },
                      { value: 24, label: '24px' }
                    ]}
                    valueLabelDisplay="auto"
                      />
                </Box>

                {/* 다크 모드 토글 */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.theme === 'dark'}
                      onChange={() => dispatch(toggleTheme())}
                      inputProps={{ role: 'switch' }}
                    />
                  }
                  label="다크 모드"
                />

                {/* 초기화 버튼 */}
                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePanelReset}
                      sx={{ flex: 1 }}
                    >
                      패널 크기 초기화
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleTextareaReset}
                      sx={{ flex: 1 }}
                    >
                      텍스트 영역 높이 초기화
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleReset}
                      sx={{ flex: 1 }}
                    >
                      모든 설정 초기화
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      {/* 마크다운 미리보기 Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6">{previewTitle} 미리보기</Typography>
          <IconButton
            onClick={handlePreviewClose}
            size="small"
            aria-label="닫기"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          mt: 2,
          '& h1': { fontSize: '2em', fontWeight: 'bold', mb: 2, mt: 3 },
          '& h2': { fontSize: '1.5em', fontWeight: 'bold', mb: 1.5, mt: 2.5, borderBottom: 1, borderColor: 'divider', pb: 1 },
          '& h3': { fontSize: '1.25em', fontWeight: 'bold', mb: 1, mt: 2 },
          '& p': { mb: 2, lineHeight: 1.6 },
          '& ul, & ol': { mb: 2, pl: 3 },
          '& li': { mb: 0.5 },
          '& code': { 
            bgcolor: 'action.hover', 
            px: 0.5, 
            py: 0.25, 
            borderRadius: 0.5,
            fontFamily: 'monospace'
          },
          '& pre': { 
            bgcolor: 'action.hover', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
            mb: 2
          },
          '& pre code': {
            bgcolor: 'transparent',
            p: 0
          },
          '& blockquote': { 
            borderLeft: 4, 
            borderColor: 'primary.main', 
            pl: 2, 
            ml: 0,
            color: 'text.secondary',
            fontStyle: 'italic'
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            mb: 2
          },
          '& th, & td': {
            border: 1,
            borderColor: 'divider',
            px: 2,
            py: 1,
            textAlign: 'left'
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 'bold'
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          },
          '& hr': {
            my: 3,
            borderColor: 'divider'
          }
        }}>
          {previewContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {previewContent}
            </ReactMarkdown>
          ) : (
            <Typography color="text.secondary" fontStyle="italic">
              내용이 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handlePreviewClose} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


