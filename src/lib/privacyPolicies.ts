import { Country } from '@/types/dataProtection';
export type { Country };

export const privacyPolicies = {
    ecuador: {
        title: 'Política de Privacidad y Protección de Datos Personales',
        law: 'Ley Orgánica de Protección de Datos Personales (2021)',
        authority: 'DINARDAP',
        authorityUrl: 'https://www.dinardap.gob.ec',

        sections: {
            responsible: {
                title: '1. Responsable del Tratamiento',
                content: `Grupo Marathon es responsable del tratamiento de sus datos personales conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador.`
            },
            dataCollected: {
                title: '2. Datos Recopilados',
                content: `Recopilamos los siguientes datos personales:
• Nombre completo
• Cédula de identidad
• Documentos laborales (contratos, certificados, etc.)
• Departamento y cargo
• Información de contacto`
            },
            purpose: {
                title: '3. Finalidad del Tratamiento',
                content: `Sus datos son utilizados exclusivamente para:
• Gestión documental de recursos humanos
• Cumplimiento de obligaciones laborales
• Archivo y consulta de documentación`
            },
            rights: {
                title: '4. Derechos ARCO',
                content: `Usted tiene derecho a:
• Acceder a sus datos personales
• Rectificar datos incorrectos o desactualizados
• Cancelar el tratamiento de sus datos
• Oponerse al tratamiento de sus datos

Para ejercer estos derechos, contacte a: {dpoEmail}`
            },
            security: {
                title: '5. Medidas de Seguridad',
                content: `Implementamos las siguientes medidas:
• Encriptación AES-256 de documentos
• Control de acceso por roles
• Auditoría completa de accesos
• Backups cifrados periódicos`
            },
            retention: {
                title: '6. Plazo de Conservación',
                content: `Sus datos serán conservados durante el tiempo que dure la relación laboral y hasta 5 años después de su terminación, conforme a la legislación ecuatoriana.`
            }
        }
    },

    peru: {
        title: 'Política de Privacidad y Protección de Datos Personales',
        law: 'Ley N° 29733 - Ley de Protección de Datos Personales',
        authority: 'Autoridad Nacional de Protección de Datos Personales',
        authorityUrl: 'https://www.minjus.gob.pe/dnpdp/',

        sections: {
            responsible: {
                title: '1. Titular del Banco de Datos',
                content: `Grupo Marathon, inscrito en el Registro Nacional de Protección de Datos Personales, es titular del banco de datos personales de empleados.`
            },
            dataCollected: {
                title: '2. Datos Personales Tratados',
                content: `Tratamos los siguientes datos personales:
• Datos de identificación (nombre, DNI)
• Datos laborales (cargo, departamento)
• Documentos de trabajo
• Información de contacto`
            },
            purpose: {
                title: '3. Finalidad del Tratamiento',
                content: `El tratamiento de datos tiene como finalidad:
• Gestión de la relación laboral
• Cumplimiento de obligaciones legales
• Administración de documentación laboral`
            },
            rights: {
                title: '4. Derechos del Titular',
                content: `Conforme a la Ley N° 29733, usted puede:
• Acceder a sus datos personales
• Actualizar datos inexactos
• Incluir datos faltantes
• Suprimir o cancelar datos
• Oponerse al tratamiento
• Revocar su consentimiento

Contacto: {dpoEmail}
Plazo de respuesta: 10 días hábiles`
            },
            security: {
                title: '5. Seguridad de Datos',
                content: `Aplicamos medidas técnicas y organizativas:
• Cifrado de extremo a extremo
• Autenticación multifactor
• Registro de auditoría
• Políticas de acceso restrictivo`
            },
            retention: {
                title: '6. Conservación de Datos',
                content: `Los datos se conservan durante la vigencia de la relación laboral y 5 años adicionales según normativa peruana.`
            },
            transfer: {
                title: '7. Transferencia Internacional',
                content: `Sus datos pueden ser almacenados en servidores ubicados en Estados Unidos (Supabase), que cuenta con medidas de seguridad adecuadas y cláusulas contractuales estándar.`
            }
        }
    },

    chile: {
        title: 'Política de Privacidad y Protección de Datos Personales',
        law: 'Ley N° 19.628 sobre Protección de la Vida Privada',
        authority: 'Consejo para la Transparencia',
        authorityUrl: 'https://www.consejotransparencia.cl',

        sections: {
            responsible: {
                title: '1. Responsable de la Base de Datos',
                content: `Grupo Marathon, inscrito en el Registro de Bancos de Datos Personales del Servicio de Registro Civil, es responsable de la base de datos de personal.`
            },
            dataCollected: {
                title: '2. Datos Personales Sensibles',
                content: `Recopilamos datos personales sensibles:
• RUT y nombre completo
• Documentos laborales
• Información de cargo y departamento
• Datos de contacto`
            },
            purpose: {
                title: '3. Finalidad del Tratamiento',
                content: `Los datos son tratados para:
• Administración de recursos humanos
• Cumplimiento de obligaciones laborales y tributarias
• Gestión documental empresarial`
            },
            consent: {
                title: '4. Consentimiento',
                content: `El tratamiento de sus datos sensibles requiere su consentimiento expreso y por escrito, el cual puede revocar en cualquier momento.`
            },
            rights: {
                title: '5. Derechos del Titular',
                content: `Según la Ley N° 19.628, usted tiene derecho a:
• Ser informado sobre sus datos almacenados
• Solicitar modificación de datos erróneos
• Solicitar eliminación de datos
• Bloquear datos en caso de uso indebido

Contacto: {dpoEmail}
Plazo de respuesta: 2 días hábiles`
            },
            security: {
                title: '6. Seguridad',
                content: `Garantizamos la seguridad mediante:
• Encriptación de datos en reposo y tránsito
• Control de acceso basado en roles
• Monitoreo continuo de seguridad
• Auditorías periódicas`
            },
            retention: {
                title: '7. Plazo de Conservación',
                content: `Los datos se mantienen durante la relación laboral y hasta 5 años posteriores a su término, según normativa chilena.`
            }
        }
    }
};

export function getPrivacyPolicy(country: Country, companyConfig?: {
    companyName?: string;
    ruc?: string;
    dpoEmail?: string;
    privacyEmail?: string;
}) {
    const policy = (privacyPolicies as any)[country];

    // Default company config
    const config = {
        companyName: companyConfig?.companyName || 'Grupo Marathon',
        ruc: companyConfig?.ruc || 'N/A',
        dpoEmail: companyConfig?.dpoEmail || 'privacidad@grupomarathon.com',
        privacyEmail: companyConfig?.privacyEmail || 'privacidad@grupomarathon.com'
    };

    // Reemplazar variables en el contenido
    const processContent = (content: string) => {
        return content
            .replace('{companyName}', config.companyName)
            .replace('{ruc}', config.ruc)
            .replace('{dpoEmail}', config.dpoEmail)
            .replace('{privacyEmail}', config.privacyEmail);
    };

    return {
        ...policy,
        sections: Object.fromEntries(
            Object.entries(policy.sections).map(([key, section]: [string, any]) => [
                key,
                {
                    ...section,
                    content: processContent(section.content)
                }
            ])
        )
    };
}
