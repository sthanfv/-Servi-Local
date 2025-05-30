
import Stripe from 'stripe';
import { storage } from './storage';
import { logSecurityEvent } from './monitoring';

// Configuración de Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
}) : null;

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  paymentMethod: 'stripe' | 'pse' | 'bancolombia';
  metadata?: any;
}

export interface PSEPayment {
  bank: string;
  documentType: 'CC' | 'CE' | 'NIT';
  documentNumber: string;
  amount: number;
  description: string;
}

// Integración con Stripe para pagos internacionales
export const createStripePayment = async (
  amount: number,
  currency: string = 'cop',
  serviceId?: number
): Promise<PaymentIntent> => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe usa centavos
      currency: currency.toLowerCase(),
      metadata: {
        serviceId: serviceId?.toString() || '',
        platform: 'servilocal',
      },
    });

    logSecurityEvent('payment_created', {
      paymentId: paymentIntent.id,
      amount,
      currency,
      serviceId,
    }, 'info');

    return {
      id: paymentIntent.id,
      amount,
      currency,
      status: 'pending',
      paymentMethod: 'stripe',
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    logSecurityEvent('payment_error', {
      error: error.message,
      amount,
      currency,
    }, 'error');
    throw error;
  }
};

// Simulación de PSE (Banco en línea Colombia)
export const createPSEPayment = async (payment: PSEPayment): Promise<PaymentIntent> => {
  // En producción, integrar con PSE real (Redeban, ACH Colombia)
  const paymentId = `pse_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Validaciones PSE
  if (payment.amount < 5000) { // Mínimo $5,000 COP
    throw new Error('Monto mínimo para PSE es $5,000 COP');
  }

  if (!['CC', 'CE', 'NIT'].includes(payment.documentType)) {
    throw new Error('Tipo de documento inválido');
  }

  // Simular proceso PSE
  await storage.createPaymentRecord({
    id: paymentId,
    amount: payment.amount,
    currency: 'COP',
    status: 'pending',
    paymentMethod: 'pse',
    metadata: {
      bank: payment.bank,
      documentType: payment.documentType,
      documentNumber: payment.documentNumber,
      description: payment.description,
    },
  });

  logSecurityEvent('pse_payment_created', {
    paymentId,
    amount: payment.amount,
    bank: payment.bank,
  }, 'info');

  return {
    id: paymentId,
    amount: payment.amount,
    currency: 'COP',
    status: 'pending',
    paymentMethod: 'pse',
    metadata: payment,
  };
};

// Webhook para confirmar pagos
export const handlePaymentWebhook = async (event: any, signature: string): Promise<void> => {
  if (stripe) {
    try {
      const stripeEvent = stripe.webhooks.constructEvent(
        event,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (stripeEvent.type === 'payment_intent.succeeded') {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        
        await storage.updatePaymentStatus(paymentIntent.id, 'succeeded');
        
        logSecurityEvent('payment_confirmed', {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
        }, 'info');
      }
    } catch (error) {
      logSecurityEvent('webhook_error', {
        error: error.message,
      }, 'error');
      throw error;
    }
  }
};

// Facturación electrónica DIAN (Colombia)
export interface InvoiceData {
  customerName: string;
  customerId: string;
  customerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
  }>;
  paymentId: string;
}

export const generateInvoice = async (data: InvoiceData): Promise<string> => {
  // En producción, integrar con proveedor de facturación DIAN
  // Ejemplo: FacturAPI, Alegra, Siigo
  
  const invoiceNumber = `FE-${Date.now()}`;
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxes = data.items.reduce((sum, item) => sum + item.tax, 0);
  const total = subtotal + taxes;

  const invoice = {
    number: invoiceNumber,
    date: new Date().toISOString(),
    customer: {
      name: data.customerName,
      id: data.customerId,
      email: data.customerEmail,
    },
    items: data.items,
    subtotal,
    taxes,
    total,
    paymentReference: data.paymentId,
  };

  await storage.saveInvoice(invoice);

  logSecurityEvent('invoice_generated', {
    invoiceNumber,
    total,
    paymentId: data.paymentId,
  }, 'info');

  return invoiceNumber;
};
