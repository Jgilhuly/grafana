import { Meta, StoryFn } from '@storybook/react';

import { FileUpload } from './FileUpload';
import mdx from './FileUpload.mdx';

const meta: Meta<typeof FileUpload> = {
  title: 'Inputs/FileUpload',
  component: FileUpload,
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['className', 'onFileUpload'],
    },
  },
  argTypes: {
    size: {
      control: {
        type: 'select',
      },
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
};

const logUpload = (file?: File) => {
  console.info(
    JSON.stringify({
      level: 'info',
      message: 'File upload',
      context: {
        name: file?.name,
        size: file?.size,
        type: file?.type,
      },
    })
  );
};

export const Basic: StoryFn<typeof FileUpload> = (args) => {
  return (
    <FileUpload
      size={args.size}
      onFileUpload={({ currentTarget }) => logUpload(currentTarget?.files && currentTarget.files[0])}
    />
  );
};
Basic.args = {
  size: 'md',
};

export default meta;
