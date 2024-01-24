import { Account } from '@/modules/auth/Account';
import { getAccountList } from '@/modules/auth/AccountTools';
import { getTranslation } from '@/modules/i18n/Locale';
import { useAsyncEffect, useState } from '@/renderer/util/Hooks';
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
        return {
            label: a.playerName,
            value: a.uuid
        };
    });

    return (
        <Dialog
            style={{ width: '30rem' }}
            header={getTranslation('account.select-account')}
            visible={props.open}
            onHide={() => {}}
            closable={false}
        >
            <ListBox
                value={selUUID}
                options={items}
                onChange={(e) => {
                    setSelUUID(e.value);
                    props.onSelect(accounts.find((v) => v.uuid == e.value) ?? null);
                }}
            />
        </Dialog>
    );
}
