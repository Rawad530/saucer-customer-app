import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupEmailRequest {
  orders: any[];
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Backup email function called');
    
    // Check if Resend API key is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not configured");
    }
    
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
    
    const { orders, email }: BackupEmailRequest = requestBody;
    console.log('Parsed data:', { ordersCount: orders?.length, email });

    if (!orders || !email) {
      throw new Error("Orders and email are required");
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new Error("Orders must be a non-empty array");
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Helper function to parse item details (updated to match frontend)
    const parseItemDetails = (itemName: string) => {
      const lowerName = itemName.toLowerCase();
      
      // Check for specific categories
      const isDrink = ['coca cola', 'fanta', 'sprite', 'cappy', 'ice tea', 'water'].some(drink => lowerName.includes(drink));
      const isSauce = ['sauce', 'cup', 'jalapeno'].some(sauce => lowerName.includes(sauce));
      const isSide = ['fries', 'onion rings', 'strips'].some(side => lowerName.includes(side));
      const isAddon = lowerName.includes('add ');
      
      if (isDrink) {
        return {
          mainItem: itemName,
          protein: 'N/A',
          load: 'N/A',
          type: 'Drink'
        };
      }
      
      if (isSauce) {
        return {
          mainItem: itemName,
          protein: 'N/A',
          load: 'N/A',
          type: 'Sauce'
        };
      }
      
      if (isSide) {
        return {
          mainItem: itemName,
          protein: 'N/A',
          load: 'N/A',
          type: 'Side'
        };
      }
      
      if (isAddon) {
        return {
          mainItem: itemName,
          protein: 'N/A',
          load: 'N/A',
          type: 'Add-on'
        };
      }
      
      // Check if item is actually a burger or wrap
      const isBurgerOrWrap = lowerName.includes('burger') || lowerName.includes('wrap');
      
      if (!isBurgerOrWrap) {
        return {
          mainItem: itemName,
          protein: 'N/A',
          load: 'N/A',
          type: 'Other'
        };
      }
      
      // Original logic for burgers and wraps only
      const isWrap = lowerName.includes('wrap');
      const mainItem = isWrap ? 'Wrap' : 'Burger';
      
      const isChicken = lowerName.includes('chicken');
      const isBeef = lowerName.includes('beef');
      const protein = isChicken ? 'Chicken' : isBeef ? 'Beef' : 'N/A';
      
      const isDouble = lowerName.includes('double');
      const load = isDouble ? 'Double' : 'Single';
      
      const isCombo = lowerName.includes('combo');
      const type = isCombo ? 'Combo' : 'A la carte';
      
      return { mainItem, protein, load, type };
    };

    // Generate HTML table rows
    const tableRows = orders.flatMap(order =>
      order.items.map(item => {
        const { mainItem, protein, load, type } = parseItemDetails(item.menuItem.name);
        const addons = Array.isArray(item.addons) ? [...item.addons] : [];
        if (item.spicy) addons.push('Spicy');
        
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${order.orderNumber}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(order.timestamp).toLocaleString('en-GB')}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${mainItem}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${protein}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${load}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${type}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.sauce || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${type === 'Combo' ? (item.drink || 'N/A') : 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${type === 'Combo' ? (item.sauceCup || 'N/A') : 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${addons.length > 0 ? addons.join(', ') : 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.remarks || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${order.paymentMode || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₾${(item.menuItem.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      })
    ).join('');

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Generate HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Saucer Burger - Orders Backup</h2>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #555;">Backup Summary</h3>
          <p style="margin: 5px 0;"><strong>Total Orders:</strong> ${orders.length}</p>
          <p style="margin: 5px 0;"><strong>Total Items:</strong> ${totalItems}</p>
          <p style="margin: 5px 0;"><strong>Total Revenue:</strong> ₾${totalRevenue.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Backup Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Order ID</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Order Timestamp</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Main Item</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Protein</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Load</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Type</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Sauce</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Drink</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Side Sauce</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Add Ons</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Remarks</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Payment Mode</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold;">Price (GEL)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Generated by Saucer Burger Management System</p>
        </div>
      </div>
    `;

    console.log('Sending email via Resend...');
    console.log('Email content preview:', htmlContent.substring(0, 500) + '...');
    
    const emailResponse = await resend.emails.send({
      from: "Saucer Burger <onboarding@resend.dev>",
      to: [email],
      subject: `Saucer Burger - Orders Backup ${new Date().toLocaleDateString('en-GB')}`,
      html: htmlContent,
    });
    
    console.log('Resend response:', emailResponse);

    console.log("Backup email sent successfully:", emailResponse);

    if (!emailResponse.id) {
      throw new Error("Failed to send email - no ID returned from Resend");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      id: emailResponse.id,
      message: "Backup email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-backup-email function:", error);
    
    // Return detailed error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      function: 'send-backup-email'
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);