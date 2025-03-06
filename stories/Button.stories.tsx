import React, { ComponentProps } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/theme/ui/button';
import * as PhosphorIcons from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';

type StoryProps = Omit<ComponentProps<typeof Button>, 'icon'> & {
    buttonText: string;
    iconName?: string;
    icon?: React.ComponentType<IconProps>;
};

const meta: Meta<StoryProps> = {
    title: 'Components/Button',
    component: Button,
    argTypes: {
        variant: {
            control: 'select',
            options: [
                'default',
                'secondary',
                'success',
                'destructive',
                'icon',
                'iconed',
                'outline',
                'ghost',
                'link',
                'contact',
            ],
        },
        size: {
            control: 'select',
            options: ['sm', 'default', 'lg'],
        },
        iconName: {
            control: 'text',
        },
    },
};

export default meta;

type Story = StoryObj<StoryProps>;

export const Default: Story = {
    args: {
        buttonText: 'خرید کالا',
        variant: 'default',
        size: 'default',
        iconName: 'Heart',
    },
    render: ({ buttonText, iconName, ...args }) => {
        const icons = PhosphorIcons as unknown as Record<string, React.ComponentType<IconProps>>;
        const IconComponent: React.ComponentType<IconProps> | null = iconName && icons[iconName] ? icons[iconName] : null;

        return <Button {...args} icon={IconComponent ?? undefined}>{buttonText}</Button>;
    },
};

