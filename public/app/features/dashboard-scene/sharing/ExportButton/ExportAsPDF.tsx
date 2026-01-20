import { css } from '@emotion/css';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { Alert, Button, Field, RadioButtonGroup, Select, TextLink, useStyles2 } from '@grafana/ui';
import { DashboardInteractions } from 'app/features/dashboard-scene/utils/interactions';
import { getDashboardSceneFor } from 'app/features/dashboard-scene/utils/utils';

import { SceneShareTabState, ShareView } from '../types';

import { generateDashboardPDF } from './utils';

export type PDFOrientation = 'landscape' | 'portrait';
export type PDFLayout = 'grid' | 'simple';

export class ExportAsPDF extends SceneObjectBase<SceneShareTabState> implements ShareView {
  static Component = ExportAsPDFRenderer;

  public getTabLabel() {
    return t('share-modal.pdf.title', 'Export as PDF');
  }
}

function ExportAsPDFRenderer({ model }: SceneComponentProps<ExportAsPDF>) {
  const { onDismiss } = model.useState();
  const dashboard = getDashboardSceneFor(model);
  const styles = useStyles2(getStyles);

  const [orientation, setOrientation] = useState<PDFOrientation>('landscape');
  const [layout, setLayout] = useState<PDFLayout>('grid');
  const [zoom, setZoom] = useState<number>(1);

  const [{ loading: isLoading, value: pdfBlob, error }, onExport] = useAsyncFn(async () => {
    try {
      const result = await generateDashboardPDF({
        dashboard,
        orientation,
        layout,
        zoom,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      DashboardInteractions.generateDashboardPDFClicked({
        orientation,
        layout,
        zoom,
        shareResource: 'dashboard',
        success: true,
      });

      return result.blob;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      DashboardInteractions.generateDashboardPDFClicked({
        orientation,
        layout,
        zoom,
        shareResource: 'dashboard',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      });
      throw error;
    }
  }, [dashboard, orientation, layout, zoom]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfBlob) {
        URL.revokeObjectURL(URL.createObjectURL(pdfBlob));
      }
    };
  }, [pdfBlob]);

  const onDownload = () => {
    if (!pdfBlob) {
      return;
    }

    const time = new Date().getTime();
    const name = dashboard.state.title;
    saveAs(pdfBlob, `${name}-${time}.pdf`);

    DashboardInteractions.downloadDashboardPDFClicked({
      fileName: `${name}-${time}.pdf`,
      shareResource: 'dashboard',
    });
  };

  if (!config.rendererAvailable) {
    return <RendererAlert />;
  }

  const zoomOptions = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
  ];

  return (
    <main>
      <p className={styles.info}>
        <Trans i18nKey="share-modal.pdf.info-text">Export this dashboard as a PDF document</Trans>
      </p>

      <div className={styles.optionsContainer}>
        <Field label={t('share-modal.pdf.orientation-label', 'Orientation')}>
          <RadioButtonGroup
            options={[
              { label: t('share-modal.pdf.orientation-landscape', 'Landscape'), value: 'landscape' },
              { label: t('share-modal.pdf.orientation-portrait', 'Portrait'), value: 'portrait' },
            ]}
            value={orientation}
            onChange={(value) => setOrientation(value as PDFOrientation)}
          />
        </Field>

        <Field label={t('share-modal.pdf.layout-label', 'Layout')}>
          <RadioButtonGroup
            options={[
              { label: t('share-modal.pdf.layout-grid', 'Grid'), value: 'grid' },
              { label: t('share-modal.pdf.layout-simple', 'Simple'), value: 'simple' },
            ]}
            value={layout}
            onChange={(value) => setLayout(value as PDFLayout)}
          />
        </Field>

        <Field label={t('share-modal.pdf.zoom-label', 'Zoom')}>
          <Select
            options={zoomOptions}
            value={zoom}
            onChange={(option) => setZoom(option.value ?? 1)}
            width={20}
          />
        </Field>
      </div>

      <div
        className={styles.buttonRow}
        role="group"
        aria-label={t('share-modal.pdf.actions', 'PDF export actions')}
      >
        {!pdfBlob ? (
          <Button
            variant="primary"
            onClick={onExport}
            disabled={isLoading}
            icon="file-pdf"
            aria-describedby={isLoading ? 'generate-status' : undefined}
          >
            <Trans i18nKey="share-modal.pdf.generate-button">Generate PDF</Trans>
          </Button>
        ) : (
          <Button variant="primary" onClick={onDownload} icon="download-alt">
            <Trans i18nKey="share-modal.pdf.download-button">Download PDF</Trans>
          </Button>
        )}
        <Button variant="secondary" onClick={onDismiss} fill="outline">
          <Trans i18nKey="share-modal.pdf.cancel-button">Cancel</Trans>
        </Button>
      </div>

      {isLoading && (
        <div id="generate-status" aria-live="polite" className="sr-only">
          <Trans i18nKey="share-modal.pdf.generating">Generating PDF...</Trans>
        </div>
      )}

      {error && (
        <Alert
          severity="error"
          title={t('share-modal.pdf.error-title', 'Failed to generate PDF')}
          className={styles.errorAlert}
        >
          {error instanceof Error ? error.message : 'Failed to generate PDF'}
        </Alert>
      )}
    </main>
  );
}

function RendererAlert() {
  if (config.rendererAvailable) {
    return null;
  }

  return (
    <Alert severity="info" title={t('share-modal.link.render-alert', 'Image renderer plugin not installed')}>
      <div>{t('share-modal.link.render-alert', 'Image renderer plugin not installed')}</div>
      <div>
        <Trans i18nKey="share-modal.link.render-instructions">
          To render a PDF, you must install the{' '}
          <TextLink href="https://grafana.com/grafana/plugins/grafana-image-renderer" external>
            Grafana image renderer plugin
          </TextLink>
          . Please contact your Grafana administrator to install the plugin.
        </Trans>
      </div>
    </Alert>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  info: css({
    marginBottom: theme.spacing(2),
  }),
  optionsContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(3),
  }),
  buttonRow: css({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }),
  errorAlert: css({
    marginTop: theme.spacing(2),
  }),
});
