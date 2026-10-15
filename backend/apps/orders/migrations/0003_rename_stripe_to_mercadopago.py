from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_order_coupon_order_discount_order_notes_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='order',
            old_name='stripe_payment_intent_id',
            new_name='mercadopago_preference_id',
        ),
        migrations.AlterField(
            model_name='order',
            name='mercadopago_preference_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
