from django.urls import path
from .views import InspectionViewSet, AdminInspectionViewSet

urlpatterns = [
    # 소비자용
    path('inspections/requests',
         InspectionViewSet.as_view({'post': 'create_request'}),
         name='inspection-create-request'),
    path('inspections/status',
         InspectionViewSet.as_view({'get': 'get_status'}),
         name='inspection-status'),

    # 평가사용
    path('admin/inspections/requests',
         AdminInspectionViewSet.as_view({'get': 'list_requests'}),
         name='admin-inspection-requests'),
    path('admin/inspections/requests/<str:request_id>',
         AdminInspectionViewSet.as_view({'get': 'request_detail'}),
         name='admin-inspection-request-detail'),
    path('admin/inspections/<str:request_id>/accept',
         AdminInspectionViewSet.as_view({'post': 'accept_request'}),
         name='admin-inspection-accept'),
    path('admin/inspections/<str:request_id>/reject',
         AdminInspectionViewSet.as_view({'post': 'reject_request'}),
         name='admin-inspection-reject'),
    path('admin/inspections/active',
         AdminInspectionViewSet.as_view({'get': 'list_active'}),
         name='admin-inspection-active'),
    path('admin/inspections/<str:inspection_id>/cancel',
         AdminInspectionViewSet.as_view({'post': 'cancel_active'}),
         name='admin-inspection-cancel'),
]

