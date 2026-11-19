import { SyntheticEvent, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import { MediaFile } from '../shared/media-file';
import Grid2 from '@mui/material/Unstable_Grid2';
import { downloadFilesAsZip } from '../shared/download-files-as-zip';
import { DEFAULT_SETTINGS, loadSettings } from '../shared/settings';

enum TabValue {
  Images = 'images',
  Videos = 'videos',
}

export const App = () => {
  const [tabValue, setTabValue] = useState(TabValue.Images);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [minWidthAndHeight, setMinWidthAndHeight] = useState<number>(
    DEFAULT_SETTINGS.minWidthAndHeight
  );
  const [requireResolution, setRequireResolution] = useState<boolean>(
    DEFAULT_SETTINGS.requireResolution
  );
  const [useTitleNaming, setUseTitleNaming] = useState<boolean>(
    DEFAULT_SETTINGS.useTitleNaming
  );
  const [zipInFolder, setZipInFolder] = useState<boolean>(
    DEFAULT_SETTINGS.zipInFolder
  );
  const [title, setTitle] = useState<string>('');
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<string[]>([]);

  const isMediaFileValid = (mediaFile: MediaFile) => {
    if (mediaFile.type === 'image') {
      if (
        mediaFile.width &&
        mediaFile.height &&
        mediaFile.width > minWidthAndHeight &&
        mediaFile.height > minWidthAndHeight
      ) {
        return true;
      } else if (
        !requireResolution &&
        (!mediaFile.width || !mediaFile.height)
      ) {
        return true;
      }

      return false;
    }

    return true;
  };

  const filteredMediaFiles = useMemo(() => {
    return mediaFiles
      .filter(
        (file) =>
          (file.type === 'image' && tabValue === TabValue.Images) ||
          (file.type === 'video' && tabValue === TabValue.Videos)
      )
      .filter(isMediaFileValid);
  }, [mediaFiles, tabValue, minWidthAndHeight, requireResolution]);

  useEffect(() => {
    (async () => {
      try {
        const settings = await loadSettings();

        setMinWidthAndHeight(settings.minWidthAndHeight);
        setRequireResolution(settings.requireResolution);
        setUseTitleNaming(settings.useTitleNaming);
        setZipInFolder(settings.zipInFolder);
      } catch (error) {
        console.error(error);
      }
    })();

    (async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });

        setTitle(tab?.title ?? '');

        if (tab?.id) {
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'getMediaFiles',
          });

          setMediaFiles(response || []);
          setSelectedMediaFiles([]);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const handleTabChange = (_event: SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
  };

  const handleDownloadAll = async () => {
    try {
      const urls = mediaFiles.filter(isMediaFileValid).map((file) => file.src);

      if (!urls.length) {
        return;
      }

      await downloadFilesAsZip(urls, downloadOptions());
    } catch (error) {
      console.error(error);
    }
  };

  const downloadOptions = () => ({
    title: useTitleNaming ? title : undefined,
    inFolder: zipInFolder,
  });

  const handleDownloadSelected = async () => {
    try {
      const urls = mediaFiles
        .filter(isMediaFileValid)
        .map((file) => file.src)
        .filter((src) => selectedMediaFiles.includes(src));

      if (!urls.length) {
        return;
      }

      await downloadFilesAsZip(urls, downloadOptions());
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownload =(url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.click();
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSelectFile = (file: MediaFile) => {
    setSelectedMediaFiles((prev) => {
      const hasSelected = prev.includes(file.src);

      if (hasSelected) {
        return prev.filter((src) => src !== file.src);
      } else {
        return [...prev, file.src];
      }
    });
  };

  return (
    <div
      style={{
        minWidth: '800px',
        minHeight: '600px',
      }}
    >
      <CssBaseline />
      <Container>
        <Box
          sx={{
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              position: 'relative',
            }}
          >
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label={'Images'} value={TabValue.Images} />
              <Tab label={'Videos'} value={TabValue.Videos} />
            </Tabs>
            <Tooltip title={'Settings'}>
              <IconButton
                aria-label={'Settings'}
                onClick={() => chrome.runtime.openOptionsPage()}
                sx={{ position: 'absolute', right: 0, top: 4 }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {mediaFiles.length > 0 && (
            <Box
              display={'flex'}
              alignItems={'center'}
              gap={2}
              marginTop={3}
            >
              <TextField
                variant={'filled'}
                size={'small'}
                label={'File name (title)'}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!useTitleNaming}
                sx={{ flex: 1 }}
              />
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useTitleNaming}
                      onChange={(event) =>
                        setUseTitleNaming(event.target.checked)
                      }
                    />
                  }
                  label={'Name by title'}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={zipInFolder}
                      onChange={(event) => setZipInFolder(event.target.checked)}
                    />
                  }
                  label={'Folder in zip'}
                />
              </FormGroup>
            </Box>
          )}

          <Box marginTop={4}>
            {mediaFiles.length > 0 && (
              <Box
                display={'flex'}
                alignItems={'center'}
                justifyContent={'space-between'}
                marginBottom={4}
              >
                <Stack direction={'column'} spacing={2}>
                  <Button
                    color={'secondary'}
                    variant={'contained'}
                    onClick={() => handleDownloadAll()}
                    size={'large'}
                    disabled={filteredMediaFiles.length === 0}
                  >
                    Download All
                  </Button>
                  {selectedMediaFiles.length > 0 && (
                    <Button
                      color={'secondary'}
                      variant={'contained'}
                      onClick={() => handleDownloadSelected()}
                      size={'large'}
                    >
                      Download Selected
                    </Button>
                  )}
                </Stack>

                <Box display={'flex'}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(event) => {
                            setRequireResolution(event.target.checked);
                          }}
                          checked={requireResolution}
                        />
                      }
                      label={'Require Resolution'}
                    />
                  </FormGroup>

                  <TextField
                    variant={'filled'}
                    onChange={(event) =>
                      setMinWidthAndHeight(Number(event.target.value) || 0)
                    }
                    size={'small'}
                    label={'Min Width and Height'}
                    value={minWidthAndHeight}
                  />
                </Box>
              </Box>
            )}
            {mediaFiles.length > 0 && filteredMediaFiles.length === 0 && (
              <Typography color={'grey.700'} align={'center'}>
                No files match the current filters.
              </Typography>
            )}
            <Grid2 spacing={4} container>
              {filteredMediaFiles.map((file) => {
                const hasSelected = selectedMediaFiles.includes(file.src);

                return (
                  <Grid2 xs={6} key={file.src}>
                    <Paper
                      sx={{
                        backgroundColor: hasSelected ? 'grey.300' : undefined,
                      }}
                    >
                      {file.type === 'image' ? (
                        <img
                          onClick={() => handleSelectFile(file)}
                          title={file.src}
                          width={'100%'}
                          src={file.src}
                          alt={''}
                        />
                      ) : (
                        <video title={file.src} width={'100%'} src={file.src} />
                      )}

                      {file.width && file.height && (
                        <Box display={'flex'} justifyContent={'center'} mt={2}>
                          <Typography color={'grey.700'}>
                            {file.width}x{file.height}
                          </Typography>
                        </Box>
                      )}

                      <Box
                        display={'flex'}
                        justifyContent={'center'}
                        gap={4}
                        mt={2}
                        padding={2}
                      >
                        <Button
                          fullWidth
                          onClick={() => openInNewTab(file.src)}
                          variant={'contained'}
                        >
                          Open
                        </Button>

                        <Button
                          fullWidth
                          onClick={() => handleDownload(file.src)}
                          variant={'contained'}
                        >
                          Download
                        </Button>
                      </Box>
                    </Paper>
                  </Grid2>
                );
              })}
            </Grid2>
          </Box>
        </Box>
      </Container>
    </div>
  );
};
