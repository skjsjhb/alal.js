import { Account } from '@/modules/auth/Account';
import { getAccountList } from '@/modules/auth/AccountTools';
import { getTranslation } from '@/modules/i18n/Locale';
import { useAsyncEffect, useState } from '@/renderer/util/Hooks';
import { SkinDisplay } from '@/renderer/widgets/SkinDisplay';
import { Dialog } from 'primereact/dialog';
import { ListBox } from 'primereact/listbox';
import React from 'react';

/**
 * A widget to display an account selection dialog.
 *
 * The state of this component is controlled by its parent and should be manually set to closed when select has finished.
 */
export function AccountSelector(props: { open: boolean; onSelect: (a: Account | null) => any }): React.ReactElement {
    const [selUUID, setSelUUID] = useState<string>('');
    const [accounts, setAccounts] = useState<Account[]>([]);

    useAsyncEffect(async () => {
        const a = await getAccountList();
        setAccounts(a);
    }, []);

    const items = accounts.map((a) => {
        let host = a.host;
        try {
            host = new URL(a.host).host;
        } catch {
            /* empty */
        }
        if (!host) {
            host = getTranslation('account.local-host');
        }
        return {
            label: a.playerName,
            value: a.uuid,
            host,
            skin: a.skin
        };
    });

    const itemTemplate = (item: { label: string; value: string; host: string; skin: string }) => {
        return (
            <div className={'flex gap-3 align-items-center'}>
                <SkinDisplay skin={item.skin} size={2} />
                <div className={'flex align-items-center flex-1 gap-2'}>
                    <span className={'font-bold text-xl'}>{item.label}</span>
                    <span className={'text-color-secondary'}>{item.host}</span>
                </div>
            </div>
        );
    };

    return (
        <Dialog
            style={{ width: '35rem' }}
            header={getTranslation('account.select-account')}
            visible={props.open}
            onHide={() => {}}
            closable={false}
        >
            <ListBox
                value={selUUID}
                options={items}
                itemTemplate={itemTemplate}
                onChange={(e) => {
                    setSelUUID(e.value);
                    props.onSelect(accounts.find((v) => v.uuid == e.value) ?? null);
                }}
            />
        </Dialog>
    );
}
