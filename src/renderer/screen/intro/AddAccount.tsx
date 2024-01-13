import { authMicrosoft, authYggdrasil, createLocalAccount, saveAccount } from '@/modules/auth/AccountTools';
import { runMicrosoftBrowserLogin } from '@/modules/auth/MicrosoftBrowserLogin';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useState } from '@/renderer/util/Hooks';
import { HTMLText, WarningText } from '@/renderer/widgets/Texts';
import { css } from '@emotion/react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import { classNames } from 'primereact/utils';
import React from 'react';

export function AddAccount(): React.ReactElement {
    const tr = getLocaleSection('add-account');

    const [mLoginActive, setMLoginActive] = useState(false);
    const [msUserName, setMSUserName] = useState<string | null>('');

    const [localName, setLocalName] = useState<string | null>(null);
    const localNameError = localName != null && !validateUserName(localName);

    const [yLoginActive, setYLoginActive] = useState(false);
    const [yggdrasilServer, setYggdrasilServer] = useState('');
    const [yggdrasilUser, setYggdrasilUser] = useState('');
    const [yggdrasilPwd, setYggdrasilPwd] = useState('');
    const [yggdrasilPlayerName, setYggdrasilPlayerName] = useState<string | null>('');

    const yggdrasilError = yggdrasilServer.length == 0 || yggdrasilUser.length == 0 || yggdrasilPwd.length == 0;

    const disabled = mLoginActive || yLoginActive;
    const setupComplete = !!(msUserName || (localName && !localNameError) || yggdrasilPlayerName);

    const next = useIntroNav('AddAccount');

    async function msLogin() {
        setMLoginActive(true);
        setMSUserName('');
        try {
            const code = await runMicrosoftBrowserLogin();
            if (!code) {
                setMSUserName(null);
                setMLoginActive(false);
                return;
            }
            const account = await authMicrosoft(code, 'code').wait();
            await saveAccount(account);
            setMLoginActive(false);
            setMSUserName(account.playerName);
        } catch (e) {
            console.error('Error during MS login: ' + e);
            setMLoginActive(false);
            setMSUserName(null);
        }
    }

    async function yggdrasilLogin() {
        setYLoginActive(true);
        setYggdrasilPlayerName('');
        try {
            const account = await authYggdrasil(yggdrasilServer, yggdrasilUser, yggdrasilPwd).wait();
            await saveAccount(account);
            setYLoginActive(false);
            setYggdrasilPlayerName(account.playerName);
        } catch {
            setYLoginActive(false);
            setYggdrasilPlayerName(null);
        }
    }

    async function localLogin() {
        const account = createLocalAccount(localName ?? '');
        await saveAccount(account);
    }

    return (
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <div className={'flex justify-content-center align-items-center'} style={{ height: '6rem' }}>
                <i className={'pi pi-user-plus text-6xl'} />
            </div>

            <div className={'text-4xl font-bold'}>{tr('title')}</div>
            <TabView
                className={'mt-3'}
                css={css`
                    & .p-tabview-nav {
                        justify-content: center;
                    }

                    & .p-tabview-panels {
                        padding-bottom: 1rem !important;
                    }
                `}
            >
                {/* Microsoft Login */}
                <TabPanel header={tr('ms.title')} leftIcon={'pi pi-microsoft mr-2'} disabled={disabled}>
                    <HTMLText compact html={tr('ms.hint')} />
                    <Button
                        disabled={disabled}
                        className={'mt-3'}
                        icon={classNames('pi', mLoginActive ? 'pi-spin pi-spinner' : 'pi-microsoft')}
                        label={tr(mLoginActive ? 'wait' : 'ms.button')}
                        onClick={msLogin}
                    />
                    {msUserName && <div className={'mt-3 text-success'}>{tr('greet', { name: msUserName })}</div>}
                    {msUserName == null && <WarningText text={tr('fail')} />}
                </TabPanel>

                {/* Yggdrasil Login */}
                <TabPanel header={tr('yggdrasil.title')} leftIcon={'pi pi-user-plus mr-2'} disabled={disabled}>
                    <HTMLText compact html={tr('yggdrasil.hint')} />
                    <div className={'mt-3 flex gap-2'}>
                        <span className={'p-input-icon-left no-cjk-icon-correction flex-grow-1'}>
                            <i className={'pi pi-server'} />
                            <InputText
                                className={'w-full'}
                                placeholder={tr('yggdrasil.server')}
                                value={yggdrasilServer}
                                onChange={(e) => setYggdrasilServer(e.target.value)}
                            />
                        </span>
                    </div>
                    <div className={'mt-1 flex gap-2'}>
                        <span className={'p-input-icon-left no-cjk-icon-correction flex-grow-1'}>
                            <i className={'pi pi-user'} />
                            <InputText
                                className={'w-full'}
                                placeholder={tr('yggdrasil.user')}
                                value={yggdrasilUser}
                                onChange={(e) => setYggdrasilUser(e.target.value)}
                            />
                        </span>
                        <span className={'p-input-icon-left no-cjk-icon-correction flex-grow-1'}>
                            <i className={'pi pi-key'} />
                            <InputText
                                className={'w-full'}
                                placeholder={tr('yggdrasil.pwd')}
                                value={yggdrasilPwd}
                                type={'password'}
                                onChange={(e) => setYggdrasilPwd(e.target.value)}
                            />
                        </span>
                        <Button
                            disabled={yggdrasilError || disabled}
                            icon={yLoginActive ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            onClick={yggdrasilLogin}
                        />
                    </div>
                    {yggdrasilPlayerName && (
                        <div className={'mt-3 text-success'}>{tr('greet', { name: yggdrasilPlayerName })}</div>
                    )}
                    {yggdrasilPlayerName == null && <WarningText text={tr('fail')} />}
                </TabPanel>

                {/* Local Login */}
                <TabPanel header={tr('local.title')} leftIcon={'pi pi-user-edit mr-2'} disabled={disabled}>
                    <HTMLText compact html={tr('local.hint')} />
                    <div className={'mt-3 flex gap-2 justify-content-center'}>
                        <span className={'p-input-icon-left no-cjk-icon-correction'}>
                            <i className={'pi pi-user'} />
                            <InputText
                                placeholder={tr('local.user')}
                                value={localName ?? ''}
                                onChange={(e) => setLocalName(e.target.value)}
                            />
                        </span>
                    </div>
                    {localNameError && <HTMLText compact className={'mt-2 text-warning'} html={tr('local.error')} />}
                </TabPanel>
            </TabView>

            {/* Next page */}
            <Button
                disabled={!setupComplete}
                icon={'pi pi-arrow-right'}
                onClick={() => {
                    if (localName) {
                        void localLogin();
                    }
                    next();
                }}
            />
        </div>
    );
}

function validateUserName(u: string): boolean {
    return /^[0-9A-Za-z_]{3,16}$/.test(u);
}
