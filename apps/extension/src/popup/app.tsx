import { SyntheticEvent, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';

import { MediaFile } from '../shared/media-file';
import Grid2 from '@mui/material/Unstable_Grid2';

enum TabValue {
  Images = 'images',
  Videos = 'videos',
}

export const App = () => {
  const [tabValue, setTabValue] = useState(TabValue.Images);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const filteredMediaFiles = useMemo(() => {
    return mediaFiles.filter(
      (file) =>
        (file.type === 'image' && tabValue === TabValue.Images) ||
        (file.type === 'video' && tabValue === TabValue.Videos)
    );
  }, [mediaFiles, tabValue]);

  useEffect(() => {
    (async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });

      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'getMediaFiles',
        });

        setMediaFiles(response);
      }
    })();
  }, []);

  const handleTabChange = (_event: SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.click();
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
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
          <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label={'Images'} value={TabValue.Images} />
              <Tab label={'Videos'} value={TabValue.Videos} />
            </Tabs>
          </Box>

          <Box marginTop={8}>
            <Grid2 spacing={4} container>
              {filteredMediaFiles.map((file) => {
                return (
                  <Grid2 xs={6} key={file.src}>
                    <Paper>
                      {file.type === 'image' ? (
                        <img width={'100%'} src={file.src} alt={''} />
                      ) : (
                        <video width={'100%'} src={file.src} />
                      )}

                      <Box display={'flex'} justifyContent={'center'} gap={4}>
                        <Button
                          fullWidth
                          onClick={() => openInNewTab(file.src)}
                        >
                          Open
                        </Button>

                        <Button
                          fullWidth
                          onClick={() => handleDownload(file.src)}
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
